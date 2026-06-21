import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as bookingController from "./booking.controller.js";
import { createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from "./booking.schema.js";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), validate({ body: createBookingSchema }), bookingController.createBooking);
router.get("/me", requireAuth, validate({ query: bookingQuerySchema }), bookingController.listMyBookings);
router.get("/:id", requireAuth, bookingController.getBookingById);
router.patch("/:id/status", requireAuth, validate({ body: updateBookingStatusSchema }), bookingController.updateBookingStatus);

export default router;