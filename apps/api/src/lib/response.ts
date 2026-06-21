import { Response } from "express";

export function ok(res: Response, data?: any, message?: string) {
  return res.status(200).json({
    success: true,
    data,
    message,
  });
}

export function created(res: Response, data?: any, message?: string) {
  return res.status(201).json({
    success: true,
    data,
    message,
  });
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function badRequest(res: Response, message: string = "Bad Request", details?: any) {
  return res.status(400).json({
    success: false,
    error: {
      code: "BAD_REQUEST",
      message,
      details,
    },
  });
}

export function unauthorized(res: Response, message: string = "Unauthorized") {
  return res.status(401).json({
    success: false,
    error: {
      code: "UNAUTHORIZED",
      message,
    },
  });
}

export function forbidden(res: Response, message: string = "Forbidden") {
  return res.status(403).json({
    success: false,
    error: {
      code: "FORBIDDEN",
      message,
    },
  });
}

export function notFound(res: Response, message: string = "Not Found") {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message,
    },
  });
}

export function conflict(res: Response, message: string = "Conflict") {
  return res.status(409).json({
    success: false,
    error: {
      code: "CONFLICT",
      message,
    },
  });
}

export function serverError(res: Response, message: string = "Internal Server Error") {
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
}

export function paginated(
  res: Response,
  data: any,
  total: number,
  page: number,
  limit: number
) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
