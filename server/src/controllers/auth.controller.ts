import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator.js";
import { loginUser } from "../services/auth/auth.service.js";

import User from "../models/User.js";

export const login = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });

      return;
    }

    const authResult = await loginUser(result.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: authResult,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Authentication failed";

    if (
      message === "Invalid email or password" ||
      message === "Account is inactive"
    ) {
      res.status(401).json({
        success: false,
        message,
      });

      return;
    }

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });

      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "User account is inactive",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
