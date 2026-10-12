import * as z from "zod";

export const createSlotSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  date: z.coerce.date(),
  startTime: z
    .string()
    .regex(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid startTime format"),
  endTime: z
    .string()
    .regex(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid endTime format"),
  quantity: z.coerce.number().int().positive("quantity must be greater than 0"),
});

export const slotSchemaValidation = {
  createSlotSchema,
};
