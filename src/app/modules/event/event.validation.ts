import { z } from "zod";

const eventValidationSchema = z.object({
  eventName: z.string(),
  content: z.string(),
});

export const eventValidation = {
  eventValidationSchema,
};
