import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createNewTicket = async (payload: any) => {
  const ticketName = payload.ticketName?.trim();

  const existingEvent = await prisma.event.findUniqueOrThrow({
    where: {
      id: payload.eventId,
    },
    select: {
      id: true,
      tickets: {
        select: {
          ticketName: true,
        },
      },
    },
  });

  const isTicketNameExists = existingEvent.tickets.some(
    (ticket) =>
      ticket.ticketName.trim().toLowerCase() === ticketName.toLowerCase(),
  );

  if (isTicketNameExists) {
    throw new ApiError(400, "Ticket name already exists for this event");
  }

  await prisma.ticket.create({
    data: {
      ...payload,
      ticketName,
    },
  });

  return;
};

const getTicketsByEventId = async (eventId: string) => {
  await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    select: {
      id: true,
      ticketName: true,
      ticketPrice: true,
    },
  });

  return tickets;
};

const editTicket = async (payload: any) => {
  const existingTicket = await prisma.ticket.findUniqueOrThrow({
    where: {
      id: payload.ticketId,
    },
  });

  const ticketName = payload.ticketName?.trim() || existingTicket.ticketName;

  if (ticketName.toLowerCase() !== existingTicket.ticketName.toLowerCase()) {
    const duplicateTicket = await prisma.ticket.findFirst({
      where: {
        eventId: existingTicket.eventId,
        id: { not: existingTicket.id },
        ticketName: {
          equals: ticketName,
          mode: "insensitive",
        },
      },
    });

    if (duplicateTicket) {
      throw new ApiError(400, "Ticket name already exists for this event");
    }
  }

  await prisma.ticket.update({
    where: {
      id: payload.ticketId,
    },
    data: {
      ticketName,
      ticketPrice: payload.ticketPrice || existingTicket.ticketPrice,
    },
  });

  return
};

export const ticketService = {
  createNewTicket,
  getTicketsByEventId,
  editTicket,
};
