import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import * as bookingController from "./booking.controller";
import { createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from "./booking.schema";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), validate({ body: createBookingSchema }), bookingController.createBooking);
router.get("/me", requireAuth, validate({ query: bookingQuerySchema }), bookingController.listMyBookings);
router.get("/:id", requireAuth, bookingController.getBookingById);
router.patch("/:id/status", requireAuth, validate({ body: updateBookingStatusSchema }), bookingController.updateBookingStatus);

export default router;