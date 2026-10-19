import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`,
    );

    console.log(
      ` \n Server connected to MongoDB !!! DB host: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1);
  }
};

export default connectDB;
