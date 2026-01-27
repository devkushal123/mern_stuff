const { z } = require("zod");

const ALLOWED_ROLES = ["user", "moderator", "admin"];

exports.registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format")
    .transform((v) => v.toLowerCase()),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long (max 72 chars)")
    .refine((v) => /[A-Z]/.test(v), "Password must contain at least one uppercase letter")
    .refine((v) => /[a-z]/.test(v), "Password must contain at least one lowercase letter")
    .refine((v) => /[0-9]/.test(v), "Password must contain at least one number")
    .refine((v) => /[^A-Za-z0-9]/.test(v), "Password must contain at least one special character"),

  // role optional, default user (important!)
  role: z
    .string()
    .optional()
    .default("user")
    .refine((r) => ALLOWED_ROLES.includes(r), "Invalid role")
});


exports.loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format")
    .transform((v) => v.toLowerCase()),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required") // just non-empty
    .max(72, "Password too long")
});
