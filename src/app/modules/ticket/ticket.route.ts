import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { ticketController } from "./ticket.controller";
import { ticketValidation } from "./ticket.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.Admin),
  validateRequest(ticketValidation.ticketValidationSchema),
  ticketController.createTicket,
);
router.get("/event/:id", ticketController.getTicketsByEventId);
router.put(
  "/update",
  auth(UserRole.Admin),
  validateRequest(ticketValidation.ticketUpdateValidationSchema),
  ticketController.editTicket,
);

export const ticketRoutes = router;
