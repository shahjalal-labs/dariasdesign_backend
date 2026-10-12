import * as z from 'zod';

export const createSlotSchema = z.object({
  // Define fields
  name: z.string(),
});

export const SlotSchemaValidation = {
createSlotSchema
};
  