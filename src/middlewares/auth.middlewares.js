import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model.js";
import cookieParser from "cookie-parser";
import { ApiError } from "../utils/ApiError";

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies.accessToken;

    if (!token) {
      throw new ApiError(401, "Token not found");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SCERET);

    const userId = decodedToken?._id;
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token. ");
  }
});
