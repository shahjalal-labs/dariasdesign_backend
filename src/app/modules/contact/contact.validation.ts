import * as z from "zod";

const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  location: z.string().optional(),
  date: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  budget: z.string().optional(),
  news: z.string().optional(),
});

export const contactValidation = {
  createContactSchema,
};
