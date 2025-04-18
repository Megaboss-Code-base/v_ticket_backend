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
      .replace(/\.\d{3}Z$/, "");

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
    let virtualLink = '';
    let virtualPassword = '';

    if (event.isVirtual && event.virtualEventDetails) {
      try {
        virtualDetails = typeof event.virtualEventDetails === 'string' 
          ? JSON.parse(event.virtualEventDetails) as VirtualDetails
          : event.virtualEventDetails;

        virtualLink = virtualDetails.meetingUrl || '';
        virtualPassword = virtualDetails.passcode || '';
      } catch (error) {
        console.error('Error parsing virtual event details:', error);
      }
    }

    const mailMessage = `
      <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #444; background-color: #fafafa; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #eee;">
          <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 24px; font-weight: 600; text-align: center; letter-spacing: -0.5px;">
            Thank You, ${name}!
          </h1>
          <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
            We're thrilled to welcome you to <strong style="color: #2c3e50;">${
              event.title
            }</strong>. Below are the details of your ticket and event information.
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
              Event Details
            </h2>
            <ul style="margin: 0; padding: 0; list-style: none;">
              <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                <strong style="color: #2c3e50; display: inline-block; width: 100px;">Event:</strong> ${
                  event.title
                }
              </li>
              <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Type:</strong> ${
                  ticket.ticketType
                }
              </li>
              ${
                event.isVirtual && virtualDetails
                  ? `
                    <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                      <strong style="color: #2c3e50; display: inline-block; width: 100px;">Virtual Platform:</strong> ${
                        virtualDetails.platform || 'Not specified'
                      }
                    </li>
                    <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                      <strong style="color: #2c3e50; display: inline-block; width: 100px;">Meeting Link:</strong> 
                      <a href="${virtualLink}" target="_blank">Join Meeting</a>
                    </li>
                    ${
                      virtualPassword
                        ? `
                          <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                            <strong style="color: #2c3e50; display: inline-block; width: 100px;">Passcode:</strong> ${virtualPassword}
                          </li>
                        `
                        : ''
                    }
                    <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                      <strong style="color: #2c3e50; display: inline-block; width: 100px;">Meeting ID:</strong> ${
                        virtualDetails.meetingId || 'Not specified'
                      }
                    </li>
                  `
                  : ''
              }
              <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                <strong style="color: #2c3e50; display: inline-block; width: 100px;">Amount Paid:</strong> ${currency} ${totalAmount.toFixed(
                  2
                )}
              </li>
              ${
                ticketPrice
                  ? `
                    <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                      <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Price:</strong> ${currency} ${ticketPrice}
                    </li>
                  `
                  : ''
              }
              <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                <strong style="color: #2c3e50; display: inline-block; width: 100px;">Date:</strong> ${new Date(
                  event.date
                ).toLocaleDateString()}
              </li>
              ${
                event.location
                  ? `
                    <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
                      <strong style="color: #2c3e50; display: inline-block; width: 100px;">Location:</strong> ${event.location}
                    </li>
                  `
                  : ""
              }
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <p style="margin: 16px 0; font-size: 18px; color: #2c3e50; font-weight: 500;">
              Your QR Code
            </p>
            <img src="${
              ticket.qrCode
            }" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff;">
            <p style="margin: 16px 0;">
              <a href="${
                ticket.qrCode
              }" download="ticket_qr.png" style="display: inline-block; padding: 12px 24px; margin: 16px 0; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
                Download QR Code
              </a>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
              Add to Calendar
            </h2>
            <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
              Don't forget to add the event to your calendar:
            </p>
            <div style="text-align: center;">
              <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
                Google Calendar
              </a>
              <a href="${icsUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
                Outlook/Apple Calendar
              </a>
            </div>
          </div>

          <div style="margin-top: 32px; font-size: 14px; color: #777; text-align: center;">
            <p style="margin: 16px 0;">
              Best regards,<br>
              <strong style="color: #2c3e50;">The Event Team</strong>
            </p>
            ${
              event.socialMediaLinks
                ? `
                  <p style="margin: 16px 0;">
                    Follow us on 
                    ${
                      event.socialMediaLinks.twitter
                        ? `<a href="${event.socialMediaLinks.twitter}" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Twitter</a>`
                        : ''
                    }
                    ${
                      event.socialMediaLinks.facebook
                        ? ` or <a href="${event.socialMediaLinks.facebook}" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Facebook</a>`
                        : ''
                    }
                    for updates!
                  </p>
                `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    // Send the email
    await sendEmail({
      email,
      subject: `Your Ticket for "${event.title}"`,
      message: mailMessage,
    });
  } catch (err: any) {
    console.error("Error sending ticket email:", err.message);
    throw err;
  }
};

// export const sendTicketEmail = async (
//   name: string,
//   email: string,
//   event: any,
//   ticket: any,
//   totalAmount: number,
//   currency: string,
//   ticketPrice?: number,
// ): Promise<void> => {
//   try {
//     const googleCalendarLink = generateGoogleCalendarLink(event);
//     const icsContent = generateICS(event);
//     const icsUrl = await uploadICSFileToCloudinary(
//       `event-${event.id}.ics`,
//       icsContent
//     );

//     const mailMessage = `
//   <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #444; background-color: #fafafa; padding: 40px;">
//     <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #eee;">
//       <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 24px; font-weight: 600; text-align: center; letter-spacing: -0.5px;">
//         Thank You, ${name}!
//       </h1>
//       <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
//         We’re thrilled to welcome you to <strong style="color: #2c3e50;">${
//           event.title
//         }</strong>. Below are the details of your ticket and event information.
//       </p>

//       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
//         <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
//           Event Details
//         </h2>
//         <ul style="margin: 0; padding: 0; list-style: none;">
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Event:</strong> ${
//               event.title
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Type:</strong> ${
//               ticket.ticketType
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Virtual Link:</strong> ${
//               event.virtualEventDetails
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Virtual Password:</strong> ${
//               event.virtualEventDetails
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Amount Paid:</strong> ${currency} ${totalAmount.toFixed(
//       2
//     )}
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Price:</strong> ${currency} ${ticketPrice}
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Date:</strong> ${new Date(
//               event.date
//             ).toLocaleDateString()}
//           </li>
//           ${
//             event.location
//               ? `
//             <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//               <strong style="color: #2c3e50; display: inline-block; width: 100px;">Location:</strong> ${event.location}
//             </li>
//           `
//               : ""
//           }
//         </ul>
//       </div>

//       <div style="text-align: center; margin: 32px 0;">
//         <p style="margin: 16px 0; font-size: 18px; color: #2c3e50; font-weight: 500;">
//           Your QR Code
//         </p>
//         <img src="${
//           ticket.qrCode
//         }" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff;">
//         <p style="margin: 16px 0;">
//           <a href="${
//             ticket.qrCode
//           }" download="ticket_qr.png" style="display: inline-block; padding: 12px 24px; margin: 16px 0; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Download QR Code
//           </a>
//         </p>
//       </div>

//       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
//         <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
//           Add to Calendar
//         </h2>
//         <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
//           Don’t forget to add the event to your calendar:
//         </p>
//         <div style="text-align: center;">
//           <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Google Calendar
//           </a>
//           <a href="${icsUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Outlook/Apple Calendar
//           </a>
//         </div>
//       </div>

//       <div style="margin-top: 32px; font-size: 14px; color: #777; text-align: center;">
//         <p style="margin: 16px 0;">
//           Best regards,<br>
//           <strong style="color: #2c3e50;">The Event Team</strong>
//         </p>
//         <p style="margin: 16px 0;">
//           Follow us on 
//           <a href="https://twitter.com/eventteam" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Twitter</a> 
//           or 
//           <a href="https://facebook.com/eventteam" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Facebook</a> 
//           for updates!
//         </p>
//       </div>
//     </div>
//   </div>
// `;

//     // Send the email
//     await sendEmail({
//       email,
//       subject: `Your Ticket for "${event.title}"`,
//       message: mailMessage,
//     });
//   } catch (err: any) {
//     console.error("Error sending ticket email:", err.message);
//     throw err;
//   }
// };