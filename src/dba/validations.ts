import * as z from "zod";

export const usersSchema = z
  .object({
    email: z.email("Invalid email address"),
    // Required on create only; enforced in the form's submit handler
    password: z.string(),
    full_name: z.string(),
    display_name: z.string(),
    role: z.enum(["CAMUNDA", "CUSTOMER"]),
    customer_id: z.string(),
    country: z.string(),
    city: z.string(),
    locale: z.string(),
    timezone: z.string(),
    active: z.boolean(),
  })
  .refine((v) => v.role !== "CUSTOMER" || v.customer_id !== "", {
    path: ["customer_id"],
    message: "Customer is required",
  });

export type UsersFormValues = z.infer<typeof usersSchema>;
