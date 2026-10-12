import { adminServices } from "./admin.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const adminOverview = catchAsync(async (req, res) => {
  const result = await adminServices.adminOverview(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin overview data retrieved successfully",
    data: result,
  });
});

const users = catchAsync(async (req, res) => {
  const result = await adminServices.users(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users data retrieved successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await adminServices.deleteUser(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users deleted successfully",
    data: result,
  });
});

const bookingList = catchAsync(async (req, res) => {
  const result = await adminServices.bookingList(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Booking list retrieved successfully",
    data: result,
  });
});

const createDiscount = catchAsync(async (req, res) => {
  await adminServices.createDiscount(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Discount created successfully",
  });
});

const getDiscounts = catchAsync(async (req, res) => {
  const data = await adminServices.getDiscounts(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Discounts retrieved successfully",
    data,
  });
});

const discountDetails = catchAsync(async (req, res) => {
  const data = await adminServices.discountDetails(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Discount details retrieved successfully",
    data,
  });
});

const updateDiscount = catchAsync(async (req, res) => {
  const data = await adminServices.updateDiscount(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Discount updated successfully",
    data,
  });
});

const deleteDiscount = catchAsync(async (req, res) => {
  const data = await adminServices.deleteDiscount(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Discount deleted successfully",
    data,
  });
});

export const adminControllers = {
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
