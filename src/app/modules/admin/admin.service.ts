import {
  endOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import prisma from "../../../shared/prisma";
import { format } from "date-fns";
import { paginationHelper } from "../../../shared/pagination";
import { Discount, Prisma } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";

const adminOverview = async (query: { filter?: string }) => {
  const { filter = "monthly" } = query;

  let startDate: Date;
  const endDate = endOfDay(new Date());

  if (filter === "daily") {
    startDate = startOfDay(subDays(new Date(), 6)); // Last 7 days
  } else if (filter === "weekly") {
    startDate = startOfWeek(subDays(new Date(), 6 * 7)); // Last 7 weeks
  } else {
    // monthly
    startDate = startOfMonth(subDays(new Date(), 30 * 11)); // Last 12 months
  }

  const tickets = await prisma.booking.findMany({
    select: {
      quantity: true,
      status: true,
    },
    where: { status: "Completed" },
  });
  const totalTicketSold = tickets.reduce(
    (sum, booking) => sum + booking.quantity,
    0,
  );
  const totalRevenue = await prisma.booking.aggregate({
    _sum: {
      price: true,
    },
    where: {
      status: "Completed",
    },
  });
  const totalRevenueValue =
    (totalRevenue._sum.price as number) * totalTicketSold || 0;
  const totalSlots = await prisma.slot.count();
  const availableSpots = await prisma.slot.aggregate({
    _sum: {
      quantity: true,
    },
  });

  // Payment Status
  const paymentStatus = await prisma.booking.groupBy({
    by: ["paymentGateway"],
    _count: {
      paymentGateway: true,
    },
    where: {
      status: "Completed",
    },
  });

  const formattedPaymentStatus = paymentStatus.map((status) => ({
    name: status.paymentGateway,
    count: status._count.paymentGateway,
  }));

  const userList = await prisma.user.findMany({
    select: {
      id: true,
      profileImage: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      status: true,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Earning Report
  const earnings = await prisma.booking.findMany({
    where: {
      status: "Completed",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      quantity: true,
      price: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const earningsByTime: { [key: string]: number } = {};
  let formatString = "MMM";
  if (filter === "daily") {
    formatString = "eee";
  } else if (filter === "weekly") {
    formatString = "dd-MMM";
  }

  earnings.forEach((booking) => {
    const timeKey = format(new Date(booking.createdAt), formatString);
    const revenue = booking.quantity * booking.price;
    earningsByTime[timeKey] = (earningsByTime[timeKey] || 0) + revenue;
  });

  const earningReport = Object.keys(earningsByTime).map((time) => ({
    time,
    total: earningsByTime[time],
  }));

  return {
    totalTicketSold: totalTicketSold ?? 0,
    totalRevenue: totalRevenueValue ?? 0,
    totalSlots: totalSlots ?? 0,
    availableSpots: availableSpots._sum.quantity || 0,
    paymentStatus: formattedPaymentStatus,
    userList,
    earningReport,
  };
};

const users = async (query: any) => {
  const { page, limit, skip, search } = paginationHelper(query);
  const whereClause: Prisma.UserWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const userList = await prisma.user.findMany({
    where: whereClause,
    skip,
    take: limit,
    select: {
      id: true,
      profileImage: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.user.count({
    where: whereClause,
  });
  const totalPage = Math.ceil(totalCount / limit);

  return {
    meta: {
      page,
      limit,
      totalCount,
      totalPage,
    },
    userList,
  };
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  await prisma.user.delete({ where: { id } });
  return;
};

const bookingList = async (query: any) => {
  const { page, limit, skip, search } = paginationHelper(query);
  const whereClause: Prisma.BookingWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const bookingList = await prisma.booking.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      paymentGateway: true,
      quantity: true,
      slot: {
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.booking.count({
    where: whereClause,
  });
  const totalPage = Math.ceil(totalCount / limit);

  return {
    meta: {
      page,
      limit,
      totalCount,
      totalPage,
    },
    bookingList,
  };
};

const createDiscount = async (data: Discount) => {
  const existingDiscount = await prisma.discount.findUnique({
    where: { code: data.code },
  });
  if (existingDiscount) {
    throw new ApiError(400, "Discount already exists");
  }

  await prisma.discount.create({
    data,
  });
  return;
};

const getDiscounts = async (query: any) => {
  const { page, limit, skip, search } = paginationHelper(query);
  const whereClause: Prisma.DiscountWhereInput = search
    ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const discounts = await prisma.discount.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCount = await prisma.discount.count({
    where: whereClause,
  });
  const totalPage = Math.ceil(totalCount / limit);
  return {
    meta: {
      page,
      limit,
      totalCount,
      totalPage,
    },
    discounts,
  };
};

const discountDetails = async (id: string) => {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) {
    throw new ApiError(404, "Discount not found");
  }
  return discount;
};

const updateDiscount = async (id: string, data: Discount) => {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) {
    throw new ApiError(404, "Discount not found");
  }

  const existingDiscountCode = await prisma.discount.findUnique({
    where: { code: data.code },
  });
  if (existingDiscountCode && existingDiscountCode.id !== id) {
    throw new ApiError(400, "Discount code already exists");
  }

  await prisma.discount.update({ where: { id }, data });
  return;
};

const deleteDiscount = async (id: string) => {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) {
    throw new ApiError(404, "Discount not found");
  }

  await prisma.discount.delete({ where: { id } });
  return;
};

export const adminServices = {
  adminOverview,
  users,
  deleteUser,
  bookingList,
  createDiscount,
  getDiscounts,
  discountDetails,
  updateDiscount,
  deleteDiscount,
};
