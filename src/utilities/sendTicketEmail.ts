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
  event: any,
  ticket: any,
  totalAmount: number,
  currency: string
): Promise<void> => {
  try {
    // Generate calendar links
    const googleCalendarLink = generateGoogleCalendarLink(event);
    const icsContent = generateICS(event);
    const icsUrl = await uploadICSFileToCloudinary(
      `event-${event.id}.ics`,
      icsContent
    );

    // Construct email message
    const mailMessage = `
      <p>Dear ${name},</p>
      <p>Thank you for purchasing a ticket to "${event.title}".</p>
      <p>Event Details:</p>
      <ul>
        <li><strong>Event:</strong> ${event.title}</li>
        <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
        <li><strong>Price:</strong> ${currency} ${totalAmount.toFixed(2)}</li>
        <li><strong>Date:</strong> ${new Date(
          event.date
        ).toLocaleDateString()}</li>
      </ul>
      <p>Your QR Code:</p>
      <img src="${ticket.qrCode}" style="max-width: 200px;">
      <p><a href="${
        ticket.qrCode
      }" download="ticket_qr.png">Download QR Code</a></p>
      <p><strong>Add to Calendar:</strong></p>
      <ul>
        <li><a href="${googleCalendarLink}" target="_blank">Google Calendar</a></li>
        <li><a href="${icsUrl}" target="_blank">Outlook/Apple Calendar</a></li>
      </ul>
      <p>Best regards,<br>Event Team</p>
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
