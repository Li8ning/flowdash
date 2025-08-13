import { NextResponse } from 'next/server';
import logger from './logger';

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public toResponse(isProduction = false): NextResponse<ErrorResponse> {
    const body: ErrorResponse = { error: this.message };
    if (!isProduction && this.details) {
      body.details = this.details;
    }
    return NextResponse.json(body, { status: this.statusCode });
  }
}

// Specific Error Classes
export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

// Centralized Error Handler
export function handleError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<NextResponse>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    const isProduction = process.env.NODE_ENV === 'production';
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        // For client errors, we can pass the message and details in dev
        if (error.statusCode < 500) {
          return error.toResponse(isProduction);
        }
        // For server errors, we log the specific error but return a generic response
        logger.error(
          { err: error, details: error.details },
          `API Error: ${error.message}`
        );
        return new InternalServerError().toResponse(isProduction);
      }

      // Handle non-ApiError instances
      const unexpectedError =
        error instanceof Error ? error : new Error(String(error));
      logger.error({ err: unexpectedError }, 'An unexpected error occurred');

      return new InternalServerError().toResponse(isProduction);
    }
  };
}