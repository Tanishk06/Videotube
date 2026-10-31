import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "User does not exist");
    }

    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens. "
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //get data from body
  const { email, username, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required. ");
  }
  if (!username) {
    throw new ApiError(400, "Username is required. ");
  }
  if (!password) {
    throw new ApiError(400, "Password is required. ");
  }

  const user = await User.findOne({
    $or: [{ username } || { email }],
  });

  if (!user) {
    throw new ApiError(401, "User does not exist. ");
  }

  const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(
    user._id
  );

  const loggedInUser = user
    .findById(user._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return (
    res
      .status(200)
      //  .cookie("accessToken",accessToken,options)
      //  .cookie("refreshToken",refreshToken,options)
      //  .json(new ApiResponse(200,loggedInUser, "User logged in successfully. "))

      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken }, //This is for mobile apps because mobile apps can't have cookies.
          "User logged in successfully"
        )
      )
  );
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  //Validation
  if (
    [username, email, fullname, password].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are mandatory");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if (coverLocalPath) {
  //   coverImage = await uploadOnCloudinary(coverImage);
  // }

  let avatar = "";
  try {
    await uploadOnCloudinary(avatarLocalPath);
    console.log("Avatar uploaded", avatar);
  } catch (error) {
    console.log("Error Uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar.");
  }

  let coverImage = "";
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.log("coverImage uploaded", coverImage);
  } catch (error) {
    console.log("Error Uploading coverImage", error);
    throw new ApiError(500, "Failed to upload coverImage.");
  }

  try {
    const user = User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = User.findById(user._id).select(
      //to deselect some feilds use .select()
      "-pasword -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user. "
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "Registered successfuly"));
  } catch (error) {
    console.log("User creation failed. ");

    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while registering a user, and images were deleted from Cloudinary. "
    );
  }
});

export { registerUser, loginUser };
