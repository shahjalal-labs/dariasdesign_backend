import { Booking, Slot } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { stripe } from "../../../helpers/stripe";
import { payPalClient } from "../../../config/paypal";
import paypal from "@paypal/checkout-server-sdk";
import { Request, Response } from "express";
import sendEmail from "../../../helpers/sendEmail";

// const createBooking = async (data: Booking) => {
//   const slotInfo = await prisma.slot.findUnique({ where: { id: data.slotId } });
//   if (!slotInfo) {
//     throw new ApiError(404, "Slot not found");
//   }
//   if (slotInfo.quantity < data.quantity) {
//     throw new ApiError(400, "Not enough quantity available");
//   }

//   const existingBooking = await prisma.booking.findFirst({
//     where: {
//       slotId: data.slotId,
//       browserId: data.browserId,
//       status: "Completed",
//     },
//   });
//   if (existingBooking) {
//     throw new ApiError(400, "You have already booked this slot");
//   }

//   let userInfo = null;
//   if (data.userId) {
//     userInfo = await prisma.user.findUnique({
//       where: { id: data.userId },
//     });
//     if (!userInfo) {
//       throw new ApiError(404, "User not found");
//     }
//   }

//   const customer = await stripe.customers.create({
//     email: data.email,
//     name: data.fullName,
//   });

//   let bookingPrice = data.price;

//   if (data.discountCode) {
//     const discount = await prisma.discount.findUnique({
//       where: { code: data.discountCode },
//     });
//     if (!discount) {
//       throw new ApiError(404, "Discount not found");
//     }
//     if (discount.isActive === false) {
//       throw new ApiError(400, "Discount is not active");
//     }
//     if (discount.endDate < new Date()) {
//       throw new ApiError(400, "Discount has expired");
//     }

//     bookingPrice = bookingPrice * (1 - discount.discount / 100);
//   }

//   const paymentMethodTypes =
//     data.paymentGateway === "Klarna" ? "klarna" : "customer_balance";

//   const session = await stripe.checkout.sessions.create({
//     mode: "payment",
//     customer: customer.id,

//     payment_method_types: [paymentMethodTypes, "card"],

//     line_items: [
//       {
//         price_data: {
//           currency: "usd",
//           product_data: {
//             name: "Whoiswedding Booking Service",
//             unit_label: "Spots",
//             description: `Slot info: ${slotInfo.startTime} to ${slotInfo.endTime}`,
//             images: [
//               "https://res.cloudinary.com/dxxt2pgz7/image/upload/v1777265384/74350e2324110335a0cb87356b6d2589d5544262_licabc.jpg",
//             ],
//           },
//           unit_amount: Math.round(bookingPrice * 100),
//         },
//         quantity: data.quantity,
//       },
//     ],

//     success_url: `https://dariasdesign-frontend.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `https://test.com/payment-cancelled`,

//     payment_method_options: {
//       customer_balance: {
//         funding_type: "bank_transfer",
//         bank_transfer: {
//           type: "us_bank_transfer",
//         },
//       },
//     },

//     metadata: {
//       slotId: data.slotId,
//       browserId: data.browserId,
//     },
//   });

//   await prisma.booking.upsert({
//     where: {
//       browserId_slotId: {
//         browserId: data.browserId,
//         slotId: data.slotId,
//       },
//     },
//     update: {
//       quantity: data.quantity,
//       price: bookingPrice,
//       discountCode: data.discountCode,
//       companyName: data.companyName,
//       fullName: data.fullName,
//       email: data.email,
//       phoneNumber: data.phoneNumber,
//       street: data.street,
//       city: data.city,
//       filmVlog: data.filmVlog,
//       isVideoGrapher: data.isVideoGrapher,
//       notes: data.notes,
//       participants: data.participants || [],
//       paymentGateway: data.paymentGateway,
//     },
//     create: {
//       ...data,
//       participants: data.participants || [],
//       price: bookingPrice,
//       paymentGateway: data.paymentGateway,
//     },
//   });
//   return {
//     checkoutUrl: session.url,
//   };
// };

// const createBookingWithPaypal = async (data: Booking) => {
//   if (data.paymentGateway !== "Paypal") {
//     throw new ApiError(400, "Invalid payment gateway for this endpoint");
//   }
//   const slotInfo = await prisma.slot.findUnique({ where: { id: data.slotId } });
//   if (!slotInfo) {
//     throw new ApiError(404, "Slot not found");
//   }
//   if (slotInfo.quantity < data.quantity) {
//     throw new ApiError(400, "Not enough quantity available");
//   }

//   const existingBooking = await prisma.booking.findFirst({
//     where: {
//       slotId: data.slotId,
//       browserId: data.browserId,
//       status: "Completed",
//     },
//   });
//   if (existingBooking) {
//     throw new ApiError(400, "You have already booked this slot");
//   }

//   let userInfo = null;
//   if (data.userId) {
//     userInfo = await prisma.user.findUnique({
//       where: { id: data.userId },
//     });
//     if (!userInfo) {
//       throw new ApiError(404, "User not found");
//     }
//   }

//   let bookingPrice = data.price;

//   if (data.discountCode) {
//     const discount = await prisma.discount.findUnique({
//       where: { code: data.discountCode },
//     });
//     if (!discount) {
//       throw new ApiError(404, "Discount not found");
//     }
//     if (discount.isActive === false) {
//       throw new ApiError(400, "Discount is not active");
//     }
//     if (discount.endDate < new Date()) {
//       throw new ApiError(400, "Discount has expired");
//     }

//     bookingPrice = bookingPrice * (1 - discount.discount / 100);
//   }

//   const client = payPalClient();
//   const request = new paypal.orders.OrdersCreateRequest();

//   request.requestBody({
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "USD",
//           value: (bookingPrice * data.quantity).toFixed(2),
//         },
//         reference_id: data.browserId,
//         custom_id: slotInfo.id,
//         invoice_id: `booking_${data.browserId}_${slotInfo.id}_${Date.now()}`,
//         description: `Booking for slot ${slotInfo.startTime} to ${slotInfo.endTime}`,
//       },
//     ],
//     application_context: {
//       brand_name: `Booking Service payment for ${slotInfo.startTime} to ${slotInfo.endTime}`,
//       landing_page: "NO_PREFERENCE",
//       user_action: "PAY_NOW",
//       shipping_preference: "NO_SHIPPING",
//       return_url: `https://dariasdesign-frontend.vercel.app/success`,
//       cancel_url: `https://test.com/api/v1/paypal-payment/cancel`,
//     },
//   });

//   await prisma.booking.upsert({
//     where: {
//       browserId_slotId: {
//         browserId: data.browserId,
//         slotId: data.slotId,
//       },
//     },
//     update: {
//       quantity: data.quantity,
//       price: bookingPrice,
//       companyName: data.companyName,
//       fullName: data.fullName,
//       email: data.email,
//       phoneNumber: data.phoneNumber,
//       street: data.street,
//       city: data.city,
//       filmVlog: data.filmVlog,
//       isVideoGrapher: data.isVideoGrapher,
//       notes: data.notes,
//       participants: data.participants || [],
//       paymentGateway: data.paymentGateway,
//     },
//     create: {
//       ...data,
//       participants: data.participants || [],
//       price: bookingPrice,
//       paymentGateway: data.paymentGateway,
//     },
//   });

//   const order = await client.execute(request);
//   const approvalUrl = order.result.links.find(
//     (link: any) => link.rel === "approve",
//   )?.href;

//   if (!approvalUrl) throw new ApiError(500, "PayPal approval URL missing");
//   return {
//     checkoutUrl: approvalUrl,
//   };
// };

const createBooking = async (data: Booking) => {
  const slotInfo = await prisma.slot.findUnique({ where: { id: data.slotId } });
  if (!slotInfo) {
    throw new ApiError(404, "Slot not found");
  }
  if (slotInfo.quantity < data.quantity) {
    throw new ApiError(400, "Not enough quantity available");
  }

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: data.eventId,
    },
  });

  if (!existingEvent) {
    throw new ApiError(404, "Event not found");
  }

  const existingTicket = await prisma.ticket.findUnique({
    where: {
      id: data.ticketId,
      eventId: data.eventId,
    },
  });

  if (!existingTicket) {
    throw new ApiError(404, "Ticket not found for the specified event");
  }

  if (slotInfo.eventId !== existingEvent.id) {
    throw new ApiError(400, "Slot does not belong to the specified event");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      slotId: data.slotId,
      browserId: data.browserId,
      status: "Completed",
    },
  });
  if (existingBooking) {
    throw new ApiError(400, "You have already booked this slot");
  }

  let userInfo = null;
  if (data.userId) {
    userInfo = await prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!userInfo) {
      throw new ApiError(404, "User not found");
    }
  }

  const customer = await stripe.customers.create({
    email: data.email,
    name: data.fullName,
  });

  let bookingPrice = existingTicket.ticketPrice;

  if (data.discountCode) {
    const discount = await prisma.discount.findUnique({
      where: { code: data.discountCode },
    });
    if (!discount) {
      throw new ApiError(404, "Discount not found");
    }
    if (discount.isActive === false) {
      throw new ApiError(400, "Discount is not active");
    }
    if (discount.endDate < new Date()) {
      throw new ApiError(400, "Discount has expired");
    }

    bookingPrice = bookingPrice * (1 - discount.discount / 100);
  }

  const paymentMethodTypes =
    data.paymentGateway === "Klarna" ? "klarna" : "customer_balance";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,

    payment_method_types: [paymentMethodTypes, "card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Whoiswedding Booking Service",
            unit_label: "Spots",
            description: `Slot info: ${slotInfo.startTime} to ${slotInfo.endTime}`,
            images: [
              "https://res.cloudinary.com/dxxt2pgz7/image/upload/v1777265384/74350e2324110335a0cb87356b6d2589d5544262_licabc.jpg",
            ],
          },
          unit_amount: Math.round(bookingPrice * 100),
        },
        quantity: data.quantity,
      },
    ],

    success_url: `https://dariasdesign-frontend.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://test.com/payment-cancelled`,

    payment_method_options: {
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: {
          type: "us_bank_transfer",
        },
      },
    },

    metadata: {
      slotId: data.slotId,
      browserId: data.browserId,
    },
  });

  await prisma.booking.upsert({
    where: {
      browserId_slotId: {
        browserId: data.browserId,
        slotId: data.slotId,
      },
    },
    update: {
      quantity: data.quantity,
      price: bookingPrice,
      discountCode: data.discountCode,
      companyName: data.companyName,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      street: data.street,
      city: data.city,
      eventId: data.eventId,
      ticketId: data.ticketId,
      filmVlog: data.filmVlog,
      isVideoGrapher: data.isVideoGrapher,
      notes: data.notes,
      participants: data.participants || [],
      paymentGateway: data.paymentGateway,
    },
    create: {
      ...data,
      participants: data.participants || [],
      price: bookingPrice,
      paymentGateway: data.paymentGateway,
    },
  });
  return {
    checkoutUrl: session.url,
  };
};

const createBookingWithPaypal = async (data: Booking) => {
  if (data.paymentGateway !== "Paypal") {
    throw new ApiError(400, "Invalid payment gateway for this endpoint");
  }
  const slotInfo = await prisma.slot.findUnique({ where: { id: data.slotId } });
  if (!slotInfo) {
    throw new ApiError(404, "Slot not found");
  }
  if (slotInfo.quantity < data.quantity) {
    throw new ApiError(400, "Not enough quantity available");
  }

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: data.eventId,
    },
  });

  if (!existingEvent) {
    throw new ApiError(404, "Event not found");
  }

  const existingTicket = await prisma.ticket.findUnique({
    where: {
      id: data.ticketId,
      eventId: data.eventId,
    },
  });

  if (!existingTicket) {
    throw new ApiError(404, "Ticket not found for the specified event");
  }

  if (slotInfo.eventId !== existingEvent.id) {
    throw new ApiError(400, "Slot does not belong to the specified event");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      slotId: data.slotId,
      browserId: data.browserId,
      status: "Completed",
    },
  });
  if (existingBooking) {
    throw new ApiError(400, "You have already booked this slot");
  }

  let userInfo = null;
  if (data.userId) {
    userInfo = await prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!userInfo) {
      throw new ApiError(404, "User not found");
    }
  }

  let bookingPrice = existingTicket.ticketPrice;

  if (data.discountCode) {
    const discount = await prisma.discount.findUnique({
      where: { code: data.discountCode },
    });
    if (!discount) {
      throw new ApiError(404, "Discount not found");
    }
    if (discount.isActive === false) {
      throw new ApiError(400, "Discount is not active");
    }
    if (discount.endDate < new Date()) {
      throw new ApiError(400, "Discount has expired");
    }

    bookingPrice = bookingPrice * (1 - discount.discount / 100);
  }

  const client = payPalClient();
  const request = new paypal.orders.OrdersCreateRequest();

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: (bookingPrice * data.quantity).toFixed(2),
        },
        reference_id: data.browserId,
        custom_id: slotInfo.id,
        invoice_id: `booking_${data.browserId}_${slotInfo.id}_${Date.now()}`,
        description: `Booking for slot ${slotInfo.startTime} to ${slotInfo.endTime}`,
      },
    ],
    application_context: {
      brand_name: `Booking Service payment for ${slotInfo.startTime} to ${slotInfo.endTime}`,
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: `https://dariasdesign-frontend.vercel.app/success`,
      cancel_url: `https://test.com/api/v1/paypal-payment/cancel`,
    },
  });

  await prisma.booking.upsert({
    where: {
      browserId_slotId: {
        browserId: data.browserId,
        slotId: data.slotId,
      },
    },
    update: {
      quantity: data.quantity,
      price: bookingPrice,
      companyName: data.companyName,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      street: data.street,
      city: data.city,
      eventId: data.eventId,
      ticketId: data.ticketId,
      filmVlog: data.filmVlog,
      isVideoGrapher: data.isVideoGrapher,
      notes: data.notes,
      participants: data.participants || [],
      paymentGateway: data.paymentGateway,
    },
    create: {
      ...data,
      participants: data.participants || [],
      price: bookingPrice,
      paymentGateway: data.paymentGateway,
    },
  });

  const order = await client.execute(request);
  const approvalUrl = order.result.links.find(
    (link: any) => link.rel === "approve",
  )?.href;

  if (!approvalUrl) throw new ApiError(500, "PayPal approval URL missing");
  return {
    checkoutUrl: approvalUrl,
  };
};

const myTickets = async (browserId: string, userId?: string) => {
  const tickets = await prisma.booking.findMany({
    where: {
      OR: [
        { browserId, status: "Completed" },
        { userId, status: "Completed" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      ticket: {
        select: {
          ticketName: true,
        },
      },
      event: {
        select: {
          eventName: true,
          bannerImage: true,
        },
      },
      slot: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (userId) {
    await prisma.booking.updateMany({
      where: {
        browserId,
        status: "Completed",
      },
      data: {
        userId,
      },
    });
  }
  return tickets;
};

const getBookingById = async (id: string) => {
  const result = await prisma.booking.findUnique({
    where: { id },
    include: {
      ticket: {
        select: {
          ticketName: true,
        },
      },
      event: {
        select: {
          eventName: true,
          bannerImage: true,
        },
      },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          date: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, "Booking not found");
  }
  return result;
};

const updateBooking = async (id: string, data: any) => {
  await prisma.booking.update({ where: { id }, data });
  return;
};

const deleteBooking = async (id: string) => {
  await prisma.booking.delete({ where: { id } });
  return;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const buildInvoiceHtml = (booking: Booking, slot: Slot) => {
  const total = booking.price * booking.quantity;
  const slotDate = new Date(slot.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const invoiceDate = new Date(booking.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; padding: 24px;">
    <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: #101214; color: #ffffff; padding: 24px;">
        <div style="font-size: 20px; letter-spacing: 1px; font-weight: 600;">WHOISWEDDING</div>
        <div style="font-size: 14px; opacity: 0.85; margin-top: 6px;">Booking Invoice</div>
      </div>

      <div style="padding: 24px; color: #111827;">
        <div style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 12px; color: #6b7280;">Invoice Date</div>
            <div style="font-size: 14px; font-weight: 600;">${invoiceDate}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Payment Status</div>
            <div style="font-size: 14px; font-weight: 600; color: #16a34a;">Completed</div>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="min-width: 220px;">
            <div style="font-size: 12px; color: #6b7280;">Billed To</div>
            <div style="font-size: 15px; font-weight: 600;">${booking.fullName}</div>
            <div style="font-size: 13px; color: #374151;">${booking.email}</div>
            <div style="font-size: 13px; color: #374151;">${booking.phoneNumber}</div>
            <div style="font-size: 13px; color: #374151;">${booking.street}, ${booking.city}</div>
          </div>

          <div style="min-width: 220px;">
            <div style="font-size: 12px; color: #6b7280;">Service</div>
            <div style="font-size: 15px; font-weight: 600;">Whoiswedding Booking</div>
            <div style="font-size: 13px; color: #374151;">Slot: ${slotDate}</div>
            <div style="font-size: 13px; color: #374151;">Time: ${slot.startTime} - ${slot.endTime}</div>
            <div style="font-size: 13px; color: #374151;">Gateway: ${booking.paymentGateway}</div>
          </div>
        </div>

        <div style="margin-top: 18px;">
          <a href="https://dariasdesign-frontend.vercel.app/ticket/${booking.id}"
            style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px;">
            View Ticket
          </a>
        </div>

        <div style="margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6; text-align: left;">
                <th style="padding: 12px; font-size: 12px; color: #6b7280;">Item</th>
                <th style="padding: 12px; font-size: 12px; color: #6b7280;">Qty</th>
                <th style="padding: 12px; font-size: 12px; color: #6b7280;">Unit Price</th>
                <th style="padding: 12px; font-size: 12px; color: #6b7280; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; font-size: 14px;">Booking Slot</td>
                <td style="padding: 12px; font-size: 14px;">${booking.quantity}</td>
                <td style="padding: 12px; font-size: 14px;">${formatCurrency(booking.price)}</td>
                <td style="padding: 12px; font-size: 14px; text-align: right;">${formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <div style="min-width: 240px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280;">
              <span>Subtotal</span>
              <span>${formatCurrency(total)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; margin-top: 8px;">
              <span>Total</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 18px; font-size: 12px; color: #6b7280;">
          ${booking.discountCode ? `Discount code applied: ${booking.discountCode}` : ""}
        </div>

        <div style="margin-top: 20px; font-size: 13px; color: #6b7280;">
          If you have any questions, reply to this email and our team will help you.
        </div>
      </div>
    </div>
  </div>
  `;
};

export const paypalWebhookService = async (req: Request, res: Response) => {
  try {
    console.log("Webhook received:", req.body.event_type);

    if (req.body.event_type === "CHECKOUT.ORDER.APPROVED") {
      const browserId = req.body.resource.purchase_units[0].reference_id;
      const slotId = req.body.resource.purchase_units[0].custom_id;

      const slotInfo = await prisma.slot.findUnique({
        where: { id: slotId },
      });
      if (!slotInfo) throw new ApiError(404, "Slot not found");

      const bookingInfo = await prisma.booking.findUnique({
        where: { browserId_slotId: { browserId, slotId } },
      });
      if (!bookingInfo) throw new ApiError(404, "Booking not found");
      if (bookingInfo.status === "Completed") {
        res.sendStatus(200);
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.slot.update({
          where: { id: slotId },
          data: {
            quantity: { decrement: bookingInfo.quantity },
          },
        });

        await tx.booking.update({
          where: { id: bookingInfo.id },
          data: {
            status: "Completed",
          },
        });
      });

      console.log(
        "Booking Payment marked as paid for booking id:",
        bookingInfo.id,
      );

      try {
        const invoiceHtml = buildInvoiceHtml(bookingInfo, slotInfo);
        const subject = `Invoice for booking ${slotInfo.startTime} to ${slotInfo.endTime}`;
        await sendEmail(bookingInfo.email, subject, invoiceHtml);
      } catch (emailErr) {
        console.error("Failed to send invoice email:", emailErr);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
};

const stripeWebhookService = async (event: any) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const browserId = session.metadata?.browserId;
      const slotId = session.metadata?.slotId;

      if (!browserId || !slotId) {
        throw new ApiError(400, "Missing booking metadata");
      }

      if (session.status === "complete") {
        const bookingInfo = await prisma.booking.findUnique({
          where: { browserId_slotId: { browserId, slotId } },
        });
        if (!bookingInfo) throw new ApiError(404, "Booking not found");
        if (bookingInfo.status === "Completed") {
          break;
        }

        const slotInfo = await prisma.slot.findUnique({
          where: { id: slotId },
        });
        if (!slotInfo) throw new ApiError(404, "Slot not found");

        await prisma.$transaction(async (tx) => {
          await tx.slot.update({
            where: { id: slotId },
            data: {
              quantity: { decrement: bookingInfo.quantity },
            },
          });

          await tx.booking.update({
            where: { id: bookingInfo.id },
            data: {
              status: "Completed",
            },
          });
        });

        try {
          const invoiceHtml = buildInvoiceHtml(bookingInfo, slotInfo);
          const subject = `Invoice for booking ${slotInfo.startTime} to ${slotInfo.endTime}`;
          await sendEmail(bookingInfo.email, subject, invoiceHtml);
        } catch (emailErr) {
          console.error("Failed to send invoice email:", emailErr);
        }

        break;
      }

      break;
    }

    default:
      break;
  }
};

const discountInfo = async (code: string) => {
  const discount = await prisma.discount.findUnique({ where: { code } });
  if (!discount) throw new ApiError(404, "Discount code not found.");

  return discount;
};

export const bookingServices = {
  createBooking,
  createBookingWithPaypal,
  stripeWebhookService,
  myTickets,
  getBookingById,
  updateBooking,
  deleteBooking,
  discountInfo,
};
