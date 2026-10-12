import { slotServices } from "./slot.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createSlot = catchAsync(async (req, res) => {
  await slotServices.createSlot(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The slot has been created successfully",
  });
});

const getAllSlots = catchAsync(async (req, res) => {
  const result = await slotServices.getAllSlots(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All slots has been retrived successfully",
    data: result,
  });
});

const availableSlots = catchAsync(async (req, res) => {
  const result = await slotServices.availableSlots();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Available slots has been retrived successfully",
    data: result,
  });
});

const getSlotById = catchAsync(async (req, res) => {
  const result = await slotServices.getSlotById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "slot has been retrived successfully",
    data: result,
  });
});

const updateSlot = catchAsync(async (req, res) => {
  await slotServices.updateSlot(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "slot has been updated successfully",
  });
});

const deleteSlot = catchAsync(async (req, res) => {
  await slotServices.deleteSlot(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "slot has been deleted successfully",
  });
});

export const slotControllers = {
  createSlot,
  getAllSlots,
  availableSlots,
  getSlotById,
  updateSlot,
  deleteSlot,
};
