import sendEmail from "../../../helpers/sendEmail";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import config from "../../../config";

export type ContactPayload = {
  firstName: string;
  lastName: string;
  location?: string;
  date?: string;
  phoneNumber: string;
  email: string;
  budget?: string;
  news?: string;
};

const buildContactHtml = (payload: ContactPayload, attachmentUrl?: string) => {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  return `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 24px;">
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: #111827; color: #ffffff; padding: 20px 24px;">
        <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px;">WHOISWEDDING</div>
        <div style="font-size: 13px; opacity: 0.85; margin-top: 6px;">New Contact Message</div>
      </div>

      <div style="padding: 24px; color: #111827;">
        <div style="font-size: 16px; font-weight: 600;">${fullName}</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${payload.email} · ${payload.phoneNumber}</div>

        <div style="margin-top: 18px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${
                payload.location
                  ? `
              <tr>
                <td style="padding: 12px; font-size: 12px; color: #6b7280; width: 160px;">Location</td>
                <td style="padding: 12px; font-size: 14px;">${payload.location}</td>
              </tr>
              `
                  : ""
              }
              ${
                payload.date
                  ? `
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; font-size: 12px; color: #6b7280;">Date</td>
                <td style="padding: 12px; font-size: 14px;">${payload.date}</td>
              </tr>
              `
                  : ""
              }
              ${
                payload.budget
                  ? `
              <tr>
                <td style="padding: 12px; font-size: 12px; color: #6b7280;">Approx. Budget</td>
                <td style="padding: 12px; font-size: 14px;">${payload.budget}</td>
              </tr>
              `
                  : ""
              }
              ${
                payload.news
                  ? `
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; font-size: 12px; color: #6b7280;">Message</td>
                <td style="padding: 12px; font-size: 14px;">${payload.news}</td>
              </tr>
              `
                  : ""
              }
              ${
                attachmentUrl
                  ? `
              <tr>
                <td style="padding: 12px; font-size: 12px; color: #6b7280;">Attachment</td>
                <td style="padding: 12px; font-size: 14px;">
                  <a href="${attachmentUrl}" style="color: #2563eb; text-decoration: none;">View uploaded file</a>
                </td>
              </tr>
              `
                  : ""
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `;
};

const createContactMessage = async (
  payload: ContactPayload,
  file?: Express.Multer.File,
) => {
  let attachmentUrl: string | undefined;

  if (file) {
    attachmentUrl = await uploadInSpace(file, "contacts/attachments");
  }

  const html = buildContactHtml(payload, attachmentUrl);
  const subject = `New contact message from ${payload.firstName} ${payload.lastName}`;
  const recipient = config.emailSender.email as string;

  await sendEmail(recipient, subject, html);

  return {
    message: "Contact message sent successfully",
  };
};

export const contactService = {
  createContactMessage,
};
