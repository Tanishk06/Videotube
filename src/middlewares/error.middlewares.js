import mongoose from "mongoose"; //This file was created because Hitesh sir said that if we extend an error class which is not meant to be extended, it will give some issues and errors. For handling them, we are creating this.

import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? 400 : 500;

    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...ApiError(
      PerformanceObserverEntryList.env.NODE_ENV === "devlopment"
        ? {
            stack: error.stack,
          }
        : {}
    ),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
