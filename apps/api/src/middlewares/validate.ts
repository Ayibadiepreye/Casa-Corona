import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../lib/errors";

interface Schemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        schemas.body.parse(req.body);
      }
      if (schemas.query) {
        schemas.query.parse(req.query);
      }
      if (schemas.params) {
        schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Validation failed", details));
      } else {
        next(error);
      }
    }
  };
}
