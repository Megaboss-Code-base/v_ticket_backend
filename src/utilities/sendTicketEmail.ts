import EventInstance, { VirtualDetails } from "../models/eventModel";
import { uploadICSFileToCloudinary } from "./multer";
import sendEmail from "./sendMail";

function generateGoogleCalendarLink(event: any) {
  const startDate = new Date(event.date).toISOString().replace(/[-:.]/g, "");
  const endDate = startDate; // Assuming it's a one-day event

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
    event.description || ""
  )}&location=${encodeURIComponent(event.location || "")}&sf=true&output=xml`;
}

function generateICS(event: any): string {
  const formatDateForICS = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/.\d{3}Z$/, "");

  const startDate = formatDateForICS(new Date(event.date));
  const endDate = formatDateForICS(new Date(event.date)); // Update if multi-day

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;
}

export const sendTicketEmail = async (
  name: string,
  email: string,
  event: EventInstance,
  ticket: {
    ticketType: string;
    qrCode: string;
    [key: string]: any;
  },
  totalAmount: number,
  currency: string,
  ticketPrice?: number
): Promise<void> => {
  try {
    // Generate calendar links
    const googleCalendarLink = generateGoogleCalendarLink(event);
    const icsContent = generateICS(event);
    const icsUrl = await uploadICSFileToCloudinary(
      `event-${event.id}.ics`,
      icsContent
    );

    // Parse virtual event details
    let virtualDetails: VirtualDetails | null = null;
    let virtualLink = "";
    let virtualPassword = "";

    if (event.isVirtual && event.virtualEventDetails) {
      try {
        virtualDetails =
          typeof event.virtualEventDetails === "string"
            ? (JSON.parse(event.virtualEventDetails) as VirtualDetails)
            : event.virtualEventDetails;

        virtualLink = virtualDetails.meetingUrl || "";
        virtualPassword = virtualDetails.passcode || "";
      } catch (error) {
        console.error("Error parsing virtual event details:", error);
      }
    }

    const mailMessage = `
      <div style="font-family: 'Georgia', serif; line-height: 1.5; color: #444; background-color: #fafafa; padding: 12px;">
        <div style="max-width: 100%; width: 100%; margin: 0 auto; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #eee;">
          <h1 style="font-size: 22px; color: #2c3e50; margin-bottom: 12px; font-weight: 600; text-align: center; letter-spacing: -0.5px; line-height: 1.3;">
            Thank You, ${name}!
          </h1>
          <p style="margin: 10px 0; font-size: 15px; color: #555; text-align: center; line-height: 1.5;">
            We're thrilled to welcome you to <strong style="color: #2c3e50;">${
              event.title
            }</strong>. Below are the details of your ticket and event information.
          </p>

          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <h2 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px; font-weight: 500; text-align: center;">
              Event Details
            </h2>
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Event:</strong> 
                <span style="flex: 1; min-width: calc(100% - 80px);">${
                  event.title
                }</span>
              </li>
              <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Ticket Type:</strong> 
                <span style="flex: 1; min-width: calc(100% - 80px);">${
                  ticket.ticketType
                }</span>
              </li>
              ${
                event.isVirtual && virtualDetails
                  ? `
                <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                  <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Virtual Platform:</strong> 
                  <span style="flex: 1; min-width: calc(100% - 80px);">${
                    virtualDetails.platform || "Not specified"
                  }</span>
                </li>
                <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                  <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Meeting Link:</strong> 
                  <span style="flex: 1; min-width: calc(100% - 80px);"><a href="${virtualLink}" target="_blank">Join Meeting</a></span>
                </li>
                ${
                  virtualPassword
                    ? `
                  <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                    <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Passcode:</strong> 
                    <span style="flex: 1; min-width: calc(100% - 80px);">${virtualPassword}</span>
                  </li>
                `
                    : ""
                }
                <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                  <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Meeting ID:</strong> 
                  <span style="flex: 1; min-width: calc(100% - 80px);">${
                    virtualDetails.meetingId || "Not specified"
                  }</span>
                </li>
              `
                  : ""
              }
              <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Amount Paid:</strong> 
                <span style="flex: 1; min-width: calc(100% - 80px);">${currency} ${totalAmount.toFixed(
      2
    )}</span>
              </li>
              ${
                ticketPrice
                  ? `
                <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                  <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Ticket Price:</strong> 
                  <span style="flex: 1; min-width: calc(100% - 80px);">${currency} ${ticketPrice}</span>
                </li>
              `
                  : ""
              }
              <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Date:</strong> 
                <span style="flex: 1; min-width: calc(100% - 80px);">${new Date(
                  event.date
                ).toLocaleDateString()}</span>
              </li>
              ${
                event.location
                  ? `
                <li style="margin-bottom: 8px; font-size: 14px; color: #555; display: flex; flex-wrap: wrap;">
                  <strong style="color: #2c3e50; min-width: 80px; display: inline-block;">Location:</strong> 
                  <span style="flex: 1; min-width: calc(100% - 80px);">${event.location}</span>
                </li>
              `
                  : ""
              }
            </ul>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 10px 0; font-size: 16px; color: #2c3e50; font-weight: 500;">
              Your QR Code
            </p>
            <img src="${
              ticket.qrCode
            }" alt="QR Code" style="width: 220px; max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff;">
            <p style="margin: 12px 0;">
              <a href="${
                ticket.qrCode
              }" download="ticket_qr.png" style="display: inline-block; padding: 8px 16px; margin: 10px 0; font-size: 14px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s; width: 100%; max-width: 200px;">
                Download QR Code
              </a>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <h2 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px; font-weight: 500; text-align: center;">
              Add to Calendar
            </h2>
            <p style="margin: 10px 0; font-size: 14px; color: #555; text-align: center;">
              Don't forget to add the event to your calendar:
            </p>
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; padding: 8px 16px; font-size: 14px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s; width: 100%; max-width: 200px;">
                Google Calendar
              </a>
              <a href="${icsUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; font-size: 14px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s; width: 100%; max-width: 200px;">
                Outlook/Apple Calendar
              </a>
            </div>
          </div>

          <div style="margin-top: 20px; font-size: 13px; color: #777; text-align: center;">
            <p style="margin: 10px 0;">
              Best regards,<br>
              <strong style="color: #2c3e50;">The Event Team</strong>
            </p>
            ${
              event.socialMediaLinks
                ? `
              <p style="margin: 10px 0;">
                Follow us on 
                ${
                  event.socialMediaLinks.twitter
                    ? `<a href="${event.socialMediaLinks.twitter}" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Twitter</a>`
                    : ""
                }
                ${
                  event.socialMediaLinks.facebook
                    ? ` or <a href="${event.socialMediaLinks.facebook}" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Facebook</a>`
                    : ""
                }
                for updates!
              </p>
            `
                : ""
            }
          </div>
        </div>
      </div>

      <!-- Desktop-specific styles -->
      <style type="text/css">
        @media screen and (min-width: 600px) {
          div[style*="max-width: 100%"] {
            max-width: 600px !important;
            padding: 30px !important;
          }
          h1[style*="font-size: 22px"] {
            font-size: 28px !important;
            margin-bottom: 20px !important;
          }
          div[style*="padding: 12px"] {
            padding: 18px !important;
          }
          h2[style*="font-size: 18px"] {
            font-size: 22px !important;
            margin-bottom: 14px !important;
          }
          li[style*="font-size: 14px"] {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }
          div[style*="margin: 20px 0"] {
            margin: 28px 0 !important;
          }
          div[style*="margin: 16px 0"] {
            margin: 20px 0 !important;
          }
          div[style*="gap: 8px"] {
            flex-direction: row !important;
            justify-content: center !important;
            gap: 12px !important;
          }
          a[style*="max-width: 200px"] {
            margin: 6px !important;
            padding: 10px 20px !important;
            font-size: 15px !important;
          }
          p[style*="font-size: 15px"] {
            font-size: 16px !important;
          }
          img[style*="width: 220px"] {
            width: 240px !important;
            padding: 14px !important;
          }
        }
      </style>
    `;

    try {
      await sendEmail({
        email,
        subject: `Your Ticket for "${event.title}"`,
        message: mailMessage,
      });
    } catch (err: any) {
      console.error("Error sending email from email service:", err.message);
    }
  } catch (err: any) {
    console.error("Error sending ticket email:", err.message);
    throw err;
  }
};
