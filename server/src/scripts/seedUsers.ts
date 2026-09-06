import "dotenv/config";

import bcrypt from "bcryptjs";

import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";

const seedUsers = async (): Promise<void> => {
  await connectDatabase();

  const adminPassword = await bcrypt.hash(
    "Admin@12345",
    12,
  );

  const clientPassword = await bcrypt.hash(
    "Client@12345",
    12,
  );

  await User.deleteMany({});

  await User.create([
    {
      name: "VaultPay Admin",
      email: "admin@vaultpay.test",
      passwordHash: adminPassword,
      role: "ADMIN",
      companyName: "Nexus Corporate Services",
      isActive: true,
    },
    {
      name: "Demo Client",
      email: "client@vaultpay.test",
      passwordHash: clientPassword,
      role: "CLIENT",
      companyName: "Demo Client Company",
      isActive: true,
    },
  ]);

  console.log("Demo users seeded successfully");

  process.exit(0);
};

seedUsers().catch((error) => {
  console.error("Failed to seed users:", error);
  process.exit(1);
});