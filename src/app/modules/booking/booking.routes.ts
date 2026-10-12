import express from "express";
import { bookingControllers } from "./booking.controller";

const router = express.Router();

router.post("/create",bookingControllers.createBooking);
router.post("/create-with-paypal", bookingControllers.createBookingWithPaypal);
router.get("/my-tickets/:browserId/:userId?", bookingControllers.myTickets);
router.get("/ticket-details/:id", bookingControllers.getBookingById);
router.patch("/:id", bookingControllers.updateBooking);
router.delete("/:id", bookingControllers.deleteBooking);
router.get("/discount-info/:code", bookingControllers.discountInfo);

export const bookingRoutes = router;
