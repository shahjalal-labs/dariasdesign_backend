import express from "express";
import { slotControllers } from "./slot.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { slotSchemaValidation } from "./slot.validation";

const router = express.Router();

router.post("/create", auth(UserRole.Admin), validateRequest(slotSchemaValidation.createSlotSchema), slotControllers.createSlot);
router.get("/all-slots", slotControllers.getAllSlots);
router.get("/available-slots", slotControllers.availableSlots);
router.get("/single-slot/:id", slotControllers.getSlotById);
router.patch("/:id", slotControllers.updateSlot);
router.delete("/:id", slotControllers.deleteSlot);

export const slotRoutes = router;
