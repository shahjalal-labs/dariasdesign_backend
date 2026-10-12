import { z } from "zod";

const ticketValidationSchema = z.object({
  ticketName: z.string(),
  ticketPrice: z.number().positive(),
  eventId: z.string(),
});

const ticketUpdateValidationSchema = z.object({
  ticketId: z.string(),
  ticketName: z.string().optional(),
  ticketPrice: z.number().positive().optional(),
});

export const ticketValidation = {
  ticketValidationSchema,
  ticketUpdateValidationSchema,
};
