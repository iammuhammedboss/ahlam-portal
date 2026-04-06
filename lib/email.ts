import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function baseTemplate(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a365d; color: white; padding: 16px 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Ahlam Dhofar Logistics</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        ${content}
      </div>
      <div style="padding: 12px 24px; text-align: center; color: #718096; font-size: 12px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #f7fafc;">
        This is an automated message from the ADL Enquiry Portal. Please do not reply to this email.
      </div>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Skipped] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Email Error] To: ${to}, Subject: ${subject}`, error);
  }
}

export async function sendEnquiryConfirmation(
  to: string,
  enquiryId: number,
  pin: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    to,
    `Enquiry #${enquiryId} Submitted - Ahlam Dhofar Logistics`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">Your Enquiry Has Been Received</h3>
      <p>Your Enquiry ID is <strong>#${enquiryId}</strong></p>
      <p>Your PIN is:</p>
      <div style="text-align: center; padding: 16px; background: #f7fafc; border-radius: 8px; margin: 16px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${pin}</span>
      </div>
      <p>Use your phone number and this PIN to log in and track your enquiry:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${appUrl}/login/customer"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Track Your Enquiry
        </a>
      </div>
      <p style="color: #e53e3e; font-size: 14px;">Please save your PIN. You will need it to log in.</p>
    `)
  );
}

export async function sendPinResetEmail(
  to: string,
  enquiryId: number,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    to,
    `PIN Reset Request - Enquiry #${enquiryId}`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">PIN Reset Request</h3>
      <p>We received a request to reset the PIN for Enquiry <strong>#${enquiryId}</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/reset-pin?token=${token}"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Your PIN
        </a>
      </div>
      <p style="font-size: 14px; color: #718096;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `)
  );
}

export async function sendAgentReplyNotification(
  to: string,
  enquiryId: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    to,
    `New Message on Enquiry #${enquiryId}`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">You Have a New Message</h3>
      <p>The agent has sent a new message on your Enquiry <strong>#${enquiryId}</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/login/customer"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Message
        </a>
      </div>
    `)
  );
}

export async function sendInvoiceNotification(
  to: string,
  enquiryId: number,
  fileName: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    to,
    `Invoice Uploaded - Enquiry #${enquiryId}`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">Invoice Available</h3>
      <p>An invoice has been uploaded to your Enquiry <strong>#${enquiryId}</strong>.</p>
      <div style="padding: 12px; background: #fffff0; border: 1px solid #ecc94b; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; font-weight: bold; color: #744210;">📄 ${fileName}</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/login/customer"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Invoice
        </a>
      </div>
    `)
  );
}

export async function sendNewEnquiryNotification(
  enquiryId: number,
  customerName: string
) {
  const agentEmail = process.env.AGENT_NOTIFICATION_EMAIL;
  if (!agentEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    agentEmail,
    `New Enquiry #${enquiryId} from ${customerName}`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">New Enquiry Received</h3>
      <p>A new enquiry has been submitted by <strong>${customerName}</strong>.</p>
      <p>Enquiry ID: <strong>#${enquiryId}</strong></p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/dashboard/enquiry/${enquiryId}"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Enquiry
        </a>
      </div>
    `)
  );
}

export async function sendCustomerReplyNotification(
  enquiryId: number,
  customerName: string
) {
  const agentEmail = process.env.AGENT_NOTIFICATION_EMAIL;
  if (!agentEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendEmail(
    agentEmail,
    `Customer Reply on Enquiry #${enquiryId}`,
    baseTemplate(`
      <h3 style="color: #1a365d; margin-top: 0;">Customer Reply</h3>
      <p><strong>${customerName}</strong> has replied on Enquiry <strong>#${enquiryId}</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/dashboard/enquiry/${enquiryId}"
           style="display: inline-block; padding: 12px 32px; background: #2b6cb0; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          View Reply
        </a>
      </div>
    `)
  );
}
