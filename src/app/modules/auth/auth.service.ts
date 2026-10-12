import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import sendEmail from "../../../helpers/sendEmail";
import { Secret } from "jsonwebtoken";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!user) throw new ApiError(404, "User not found");

  if (user.password === "123456") {
    throw new ApiError(
      403,
      "You are using google login. Please login with google.",
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password,
  );
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  if (payload.fcmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in,
  );

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

const adminLogin = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password,
  );
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  if (payload.fcmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in,
  );

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

const googleLogin = async (payload: {
  email: string;
  fullName: string;
  profileImage?: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (user) {
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.expires_in,
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      fullName: payload.fullName,
      profileImage: payload.profileImage ?? null,
      phoneNumber: "0000000000",
      fcmToken: payload.fcmToken ?? null,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    accessToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) throw new ApiError(404, "User not found");
  if (existringUser.password === "123456") {
    throw new ApiError(
      403,
      "You are using google login. Please login with google.",
    );
  }

  const otp = generateOTP();

  await prisma.otp.upsert({
    where: { email },
    update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    create: { email, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  const emailSubject = "Your Password Reset OTP";
  const emailHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hi <b>${existringUser.fullName}</b>,</p>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #007BFF;">${otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
        <p>Thanks, <br>The Support Team</p>
      </div>`;

  await sendEmail(email, emailSubject, emailHtml);

  return otp;
};

const verifyForgotPasswordOtpCodeDB = async (payload: {
  email: string;
  otp: string;
}) => {
  const { email, otp } = payload;

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const savedOtpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!savedOtpRecord) {
    throw new ApiError(400, "OTP not found. Please request a new one.");
  }
  if (new Date() > savedOtpRecord.expiresAt) {
    await prisma.otp.delete({ where: { email } });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (otp !== savedOtpRecord.otp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  const forgetToken = jwtHelpers.generateToken(
    { id: userId },
    config.jwt.jwt_secret as Secret,
    "15m",
  );

  return { forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const myProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      profileImage: true,
      email: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  return user;
};

const updateProfileIntoDB = async (
  userId: string,
  userData: User,
  file: Express.Multer.File,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found for edit");

  let profileImage;
  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      profileImage: file ? profileImage : user.profileImage,
    },
  });

  return;
};

const changePassword = async (
  newPassword: string,
  userId: string,
  oldPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) throw new ApiError(401, "Wrong old password");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const deleteAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
  return;
};

export const authService = {
  loginUserIntoDB,
  adminLogin,
  googleLogin,
  myProfile,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
  deleteAccount,
};
