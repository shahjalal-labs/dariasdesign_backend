import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { contactService } from "./contact.service";

const createContactMessage = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  const data = await contactService.createContactMessage(req.body, file);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Contact message submitted successfully",
    data,
  });
});

export const contactControllers = {
  createContactMessage,
};
