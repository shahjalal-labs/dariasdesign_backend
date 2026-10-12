import { Slot } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { startOfDay, endOfDay, format } from "date-fns";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../shared/pagination";
import { isOverlap, toMinutes } from "../../../helpers/overlap";

const createSlot = async (payload: Slot) => {
  await prisma.event.findUniqueOrThrow({
    where: { id: payload.eventId },
  });

  // Validate that endTime is not earlier than startTime
  const startTimeMinutes = toMinutes(payload.startTime);
  const endTimeMinutes = toMinutes(payload.endTime);

  if (endTimeMinutes <= startTimeMinutes) {
    throw new ApiError(
      400,
      "End time cannot be earlier than or equal to start time.",
    );
  }

  const dayStart = startOfDay(new Date(payload.date));
  const dayEnd = endOfDay(new Date(payload.date));

  const existingSlots = await prisma.slot.findMany({
    where: {
      eventId: payload.eventId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  if (existingSlots.length >= 3) {
    throw new ApiError(409, "Only 3 slots can be created for a day.");
  }

  const hasOverlap = existingSlots.some((slot) =>
    isOverlap(payload.startTime, payload.endTime, slot.startTime, slot.endTime),
  );

  if (hasOverlap) {
    throw new ApiError(
      409,
      "The selected slot time overlaps with an existing slot.",
    );
  }

  const result = await prisma.slot.create({
    data: payload,
  });

  return result;
};

const getAllSlots = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);
  const slots = await prisma.slot.findMany({
    skip,
    take: limit,
    orderBy: { date: "asc" },
  });

  const total = await prisma.slot.count();
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    slots,
  };
};

const availableSlots = async () => {
  const today = new Date();
  const slots = await prisma.slot.findMany({
    where: {
      date: {
        gte: today,
      },
      quantity: {
        gt: 0,
      },
    },
    orderBy: { date: "asc" },
  });

  const groupedObj = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const dateStr = format(new Date(slot.date), "yyyy-MM-dd");

    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }

    acc[dateStr].push(slot);
    return acc;
  }, {});

  const groupedArray = Object.keys(groupedObj).map((date) => ({
    date,
    slots: groupedObj[date],
  }));
  return groupedArray;
};

const getSlotById = async (id: string) => {
  const result = await prisma.slot.findUnique({ where: { id } });
  return result;
};

const updateSlot = async (id: string, data: Slot) => {
  const existingSlot = await prisma.slot.findUnique({ where: { id } });
  if (!existingSlot) throw new ApiError(404, "Slot not found for editing.");

  const dayStart = startOfDay(data.date);
  const dayEnd = endOfDay(data.date);

  const conflictingSlot = await prisma.slot.findFirst({
    where: {
      id: { not: id },
      startTime: data.startTime,
      endTime: data.endTime,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });
  if (conflictingSlot) {
    throw new ApiError(
      409,
      "Another slot already exists for the selected date.",
    );
  }

  await prisma.slot.update({ where: { id }, data });
  return;
};

const deleteSlot = async (id: string) => {
  const existingSlot = await prisma.slot.findUnique({ where: { id } });
  if (!existingSlot) throw new ApiError(404, "Slot not found for deleting.");

  await prisma.slot.delete({ where: { id } });
  return;
};

export const slotServices = {
  createSlot,
  getAllSlots,
  availableSlots,
  getSlotById,
  updateSlot,
  deleteSlot,
};
