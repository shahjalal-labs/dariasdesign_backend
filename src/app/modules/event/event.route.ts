import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { eventController } from "./event.controller";
import { eventValidation } from "./event.validation";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post(
  "/create",
  fileUploader.uploadMultiple,
  parseBodyData,
  validateRequest(eventValidation.eventValidationSchema),
  eventController.createEvent,
);

router.get("/all", eventController.getAllEvents);
router.get("/available", eventController.getAvailableEvents);
router.get("/details/:id", eventController.getEventDetails);
router.get("/slots/:id", eventController.eventSlots);
router.post(
  "/review",
  fileUploader.reviewImage,
  parseBodyData,
  eventController.createReview,
);
router.get("/reviews/:id", eventController.eventWiseReviews);

export const eventRoutes = router;
