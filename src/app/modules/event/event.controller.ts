import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { eventService } from "./event.service";

const createEvent = catchAsync(async (req, res) => {
  await eventService.createNewEventInDB(req);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Event created successfully",
  });
});
const getAllEvents = catchAsync(async (req, res) => {
  const { page, limit, search } = req.query;
  const events = await eventService.getAllEvents(
    Number(page) || 1,
    Number(limit) || 10,
    search as string,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Events retrieved successfully",
    data: events,
  });
});
const getAvailableEvents = catchAsync(async (req, res) => {
  const events = await eventService.getAvailableEventsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Available events retrieved successfully",
    data: events,
  });
});
const getEventDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const event = await eventService.getEventDetailsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Event details retrieved successfully",
    data: event,
  });
});
const eventSlots = catchAsync(async (req, res) => {
  const { id } = req.params;
  const slots = await eventService.getEventSlotsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Event slots retrieved successfully",
    data: slots,
  });
});
const createReview = catchAsync(async (req, res) => {
  await eventService.createReviewInDB(req);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Review created successfully",
  });
});
const eventWiseReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reviews = await eventService.getEventWiseReviewsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reviews retrieved successfully",
    data: reviews,
  });
});

export const eventController = {
  createEvent,
  getAllEvents,
  getAvailableEvents,
  getEventDetails,
  eventSlots,
  createReview,
  eventWiseReviews,
};
