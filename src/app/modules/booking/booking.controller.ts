import { bookingServices } from "./booking.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { stripe } from "../../../helpers/stripe";
import Stripe from "stripe";
import config from "../../../config";

const createBooking = catchAsync(async (req, res) => {
  const data = await bookingServices.createBooking(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The booking has been created successfully",
    data,
  });
});

const createBookingWithPaypal = catchAsync(async (req, res) => {
  const data = await bookingServices.createBookingWithPaypal(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The booking has been created successfully",
    data,
  });
});

const myTickets = catchAsync(async (req, res) => {
  const { browserId, userId } = req.params;

  const result = await bookingServices.myTickets(browserId, userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All bookings has been retrived successfully",
    data: result,
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const result = await bookingServices.getBookingById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "booking has been retrived successfully",
    data: result,
  });
});

const updateBooking = catchAsync(async (req, res) => {
  await bookingServices.updateBooking(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "booking has been updated successfully",
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  await bookingServices.deleteBooking(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "booking has been deleted successfully",
  });
});

export const stripeWebhookController = catchAsync(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    sendResponse(res, {
      success: false,
      statusCode: 400,
      message: "Missing stripe signature",
    });
    return;
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhook_secret as string,
      // "whsec_PWiYiv8emG1JjKfxOzaco5iG5Pp8E31D"
    );
  } catch (err: any) {
    sendResponse(res, {
      success: false,
      statusCode: 400,
      message: `Webhook error: ${err.message}`,
    });
    return;
  }
  await bookingServices.stripeWebhookService(event);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Webhook processed",
  });
});

const discountInfo = catchAsync(async (req, res) => {
  const data = await bookingServices.discountInfo(req.params.code);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "discount info retrived successfully",
    data,
  });
});

export const bookingControllers = {
  createBooking,
  createBookingWithPaypal,
  myTickets,
  getBookingById,
  updateBooking,
  deleteBooking,
  discountInfo,
};
