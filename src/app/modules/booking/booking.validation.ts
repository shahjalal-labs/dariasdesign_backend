import * as z from 'zod';

export const createBookingSchema = z.object({
  // Define fields
  name: z.string(),
});

export const BookingSchemaValidation = {
createBookingSchema
};
  