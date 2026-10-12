import express from "express";
import { contactControllers } from "./contact.controller";
import validateRequest from "../../middlewares/validateRequest";
import { contactValidation } from "./contact.validation";
import { fileUploader } from "../../../helpers/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.post(
  "/",
  fileUploader.upload.single("file"),
  parseBodyData,
  validateRequest(contactValidation.createContactSchema),
  contactControllers.createContactMessage,
);

export const contactRoutes = router;
