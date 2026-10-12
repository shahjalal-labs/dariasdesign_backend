import { Request } from "express";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { Prisma } from "@prisma/client";

const createNewEventInDB = async (req: Request) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const processImages = async (
    files: Express.Multer.File[] | undefined,
    folder: string,
  ) => {
    if (!files || files.length === 0) return null;
    return Promise.all(
      files.map((file) => uploadInSpace(file, `courses/${folder}`)),
    );
  };

  const [bannerImage, sliderImages, overlapImgs, sideImage] = await Promise.all(
    [
      processImages(files?.bannerImage, "bannerImage"),
      processImages(files?.sliderImages, "sliderImages"),
      processImages(files?.overlapImgs, "overlapImgs"),
      processImages(files?.sideImage, "sideImage"),
    ],
  );

  if (!bannerImage || !sliderImages || !overlapImgs || !sideImage) {
    throw new ApiError(400, "Required images are missing or failed to upload.");
  }

  await prisma.event.create({
    data: {
      ...req.body,
      bannerImage: bannerImage[0],
      sliderImages,
      overlapImgs,
      sideImage: sideImage[0],
    },
  });

  return;
};

const getAllEvents = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
) => {
  const whereCondition: Prisma.EventWhereInput = {
    ...(search && {
      eventName: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const totalEvents = await prisma.event.count();
  const filteredEventsCount = await prisma.event.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(filteredEventsCount / limit);

  const events = await prisma.event.findMany({
    where: whereCondition,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      eventName: true,
      createdAt: true,
      bannerImage: true,
      sliderImages: true,
      content: true,
      overlapImgs: true,
      _count: {
        select: {
          slots: true,
        },
      },
    },
  });

  return {
    meta: {
      totalEvents,
      filteredEvents: filteredEventsCount,
      totalPages,
      currentPage: page,
    },
    events,
  };
};

const getAvailableEventsFromDB = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: {
      slots: {
        some: {
          quantity: {
            gt: 0,
          },
          date: {
            gte: today,
          },
        },
      },
    },
    select: {
      id: true,
      eventName: true,
      bannerImage: true,
      slots: {
        where: {
          quantity: {
            gt: 0,
          },
          date: {
            gte: today,
          },
        },
        select: {
          date: true,
        },
        distinct: ["date"],
      },
    },
  });

  return events;
};

const getEventDetailsFromDB = async (id: string) => {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id },
    include: {
      slots: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          date: true,
          quantity: true,
        },
      },
      tickets: {
        select: {
          id: true,
          ticketName: true,
          ticketPrice: true,
        },
      },
    },
    omit: {
      updatedAt: true,
    },
  });

  return event;
};

const getEventSlotsFromDB = async (id: string) => {
  const slots = await prisma.slot.findMany({
    where: { eventId: id, quantity: { gt: 0 }, date: { gte: new Date() } },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      date: true,
      quantity: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return slots;
};

const createReviewInDB = async (req: Request) => {
  const file = req.file as Express.Multer.File;
  const payload = req.body;

  const processImage = async (file: Express.Multer.File, folder: string) => {
    if (!file) return null;
    return uploadInSpace(file, `courses/${folder}`);
  };

  const fileUrl = file ? await processImage(file, "reviewImage") : null;

  if (!fileUrl) {
    throw new ApiError(400, "Required image is missing or failed to upload.");
  }

  await prisma.review.create({
    data: {
      eventId: payload.eventId,
      image: fileUrl,
    },
  });

  return;
};

const getEventWiseReviewsFromDB = async (eventId: string) => {
  const reviews = await prisma.review.findMany({
    where: { eventId },
    select: {
      id: true,
      image: true,
    },
  });

  return reviews;
};

export const eventService = {
  createNewEventInDB,
  getAllEvents,
  getAvailableEventsFromDB,
  getEventDetailsFromDB,
  getEventSlotsFromDB,
  createReviewInDB,
  getEventWiseReviewsFromDB,
};
