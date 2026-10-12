import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ticketService } from "./ticket.service";

const createTicket = catchAsync(async (req, res) => {
  await ticketService.createNewTicket(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Ticket created successfully",
  });
});
const getTicketsByEventId = catchAsync(async (req, res) => {
  const tickets = await ticketService.getTicketsByEventId(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Tickets retrieved successfully",
    data: tickets,
  });
});
const editTicket = catchAsync(async (req, res) => {
  await ticketService.editTicket(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Ticket updated successfully",
  });
});

export const ticketController = {
  createTicket,
  getTicketsByEventId,
  editTicket,
};
