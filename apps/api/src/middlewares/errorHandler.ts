import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { AppError, ConflictError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal Server Error";
  let details: any = undefined;

  if (err instanceof z.ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    code = "UNAUTHORIZED";
    message = "Invalid or expired token";
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.code === "23505") { // Postgres unique violation
    statusCode = 409;
    code = "CONFLICT";
    message = "Resource already exists";
  }

  if (env.NODE_ENV !== "production") {
    details = details || { stack: err.stack };
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
