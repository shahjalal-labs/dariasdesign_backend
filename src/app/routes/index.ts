import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { slotRoutes } from "../modules/slot/slot.routes";
import { bookingRoutes } from "../modules/booking/booking.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { contactRoutes } from "../modules/contact/contact.routes";
import { eventRoutes } from "../modules/event/event.route";
import { ticketRoutes } from "../modules/ticket/ticket.route";

const router = express.Router();

const moduleRoutes = [
  { path: "/user", route: userRoutes },
  { path: "/auth", route: authRoute },
  { path: "/slot", route: slotRoutes },
  { path: "/booking", route: bookingRoutes },
  { path: "/admin", route: adminRoutes },
  { path: "/contact", route: contactRoutes },
  { path: "/event", route: eventRoutes },
  { path: "/ticket", route: ticketRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
