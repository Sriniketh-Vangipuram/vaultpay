import "dotenv/config";

import bcrypt from "bcryptjs";

import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";

const createTestClient = async (): Promise<void> => {
  try {
    await connectDatabase();

    const email = "client2@vaultpay.test";

    const existingClient = await User.findOne({ email });

    if (existingClient) {
      console.log("Test client already exists");
      console.log(`Client ID: ${existingClient._id}`);

      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(
      "Client2@12345",
      12,
    );

    const client = await User.create({
      name: "Second Demo Client",
      email,
      passwordHash,
      role: "CLIENT",
      companyName: "Second Demo Client Company",
      isActive: true,
    });

    console.log("Second test client created successfully");
    console.log(`Client ID: ${client._id}`);
    console.log(`Email: ${client.email}`);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create test client:", error);
    process.exit(1);
  }
};

void createTestClient();