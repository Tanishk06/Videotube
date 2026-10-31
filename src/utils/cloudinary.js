import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  //cloudinary.uploader.upload() performs the upload.
  try {
    if (!localFilePath) return null; //localFilePath tells Cloudinary which local file to upload.
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", //resource_type: "auto" asks Cloudinary to detect the type of media.
    });
    console.log("File uploaded on cloudinary. File src: " + response.url);
    fs.unlinkSync(localFilePath); //After a successful upload, this deletes the local temporary file.
  } catch (error) {
    console.log("Error on Cloudinary", error);

    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted From Cloudinary", publicId);
  } catch (error) {
    console.log("Error deleting from Cloudinary.", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
