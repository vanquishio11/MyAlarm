/**
 * App error types for validation, storage, and auth.
 */

export class AppError extends Error {
  constructor(message, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}

export class AuthError extends AppError {
  constructor(message = "Invalid password") {
    super(message, "AUTH_ERROR");
    this.name = "AuthError";
  }
}
