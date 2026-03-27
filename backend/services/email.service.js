import nodemailer from "nodemailer";

const getTransporter = async () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️ Email credentials missing in .env. Using fallback ethereal test account.");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export const sendInterviewLink = async (toEmail, candidateName, jobTitle, interviewLink) => {
  console.log(`📧 Attempting to send interview link to: ${toEmail}`);
  const transporter = await getTransporter();
  
  const mailOptions = {
    from: `"InterviewIQ Team" <${process.env.GMAIL_USER || "test@ethereal.email"}>`,
    to: toEmail,
    subject: `Interview Invitation for ${jobTitle} - InterviewIQ`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6C63FF; margin: 0;">InterviewInvitation</h1>
        </div>
        <p style="font-size: 16px; color: #1e293b;">Hello <strong>${candidateName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          You have been invited for an AI-powered interview for the position of <strong>${jobTitle}</strong>.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${interviewLink}" style="background: linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Start Interview
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; font-style: italic;">
          Note: This interview link is unique to you. Please do not share it.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">
          Powered by <strong>InterviewIQ</strong> - The Future of AI Recruitment
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (!process.env.GMAIL_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
  return info;
};
