import express from "express";
import { adminControllers } from "./admin.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get(
  "/overview-data",
  auth(UserRole.Admin),
  adminControllers.adminOverview,
);
router.get("/users", auth(UserRole.Admin), adminControllers.users);
router.delete(
  "/delete-user/:id",
  auth(UserRole.Admin),
  adminControllers.deleteUser,
);
router.get("/booking-list", auth(UserRole.Admin), adminControllers.bookingList);
router.post(
  "/create-discount",
  auth(UserRole.Admin),
  adminControllers.createDiscount,
);
router.get("/discounts", auth(UserRole.Admin), adminControllers.getDiscounts);
router.get("/discounts/:id", adminControllers.discountDetails);
router.patch(
  "/discounts/:id",
  auth(UserRole.Admin),
  adminControllers.updateDiscount,
);
router.delete(
  "/discounts/:id",
  auth(UserRole.Admin),
  adminControllers.deleteDiscount,
);

export const adminRoutes = router;
