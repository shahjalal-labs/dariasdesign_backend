import express from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post("/auth-login", authController.loginUser);
router.post("/admin-login", authController.adminLogin);
router.post(
  "/google-login",
  validateRequest(authValidation.googleLoginSchema),
  authController.googleLogin,
);
router.get("/profile", auth(), authController.myProfile);
router.post("/forget-password", authController.sendForgotPasswordOtp);
router.post("/verify-forget-otp", authController.verifyForgotPasswordOtpCode);
router.patch("/reset-password", auth(), authController.resetPassword);
router.patch(
  "/profile",
  auth(),
  fileUploader.profileImage,
  parseBodyData,
  authController.updateProfile,
);
router.patch("/change-password", auth(), authController.changePassword);
router.delete("/delete-account", auth(), authController.deleteAccount);

export const authRoute = router;
