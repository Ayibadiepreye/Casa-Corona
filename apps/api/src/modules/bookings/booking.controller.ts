import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import * as bookingService from "./booking.service.js";
import { ok, created } from "../../lib/response.js";
import { createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from "./booking.schema.js";
import { z } from "zod";

export async function createBooking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(req.user.userId, data);
    created(res, booking);
  } catch (e) {
    next(e);
  }
}

export async function listMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingService.listMyBookings(req.user.userId, query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const booking = await bookingService.getBookingById(req.user.userId, req.params.id as string);
    ok(res, booking);
  } catch (e) {
    next(e);
  }
}

export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updateBookingStatusSchema.parse(req.body);
    const booking = await bookingService.updateBookingStatus(req.user.userId, req.params.id as string, data);
    ok(res, booking);
  } catch (e) {
    next(e);
  }
}