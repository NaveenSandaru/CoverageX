import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendReminder = async (email, title, created, deadline) => {
  const mailOptions = {
    from: `"Day Craft" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reminder: Task "${title}" is approaching`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #43a047;">Task Reminder</h2>
        <p>Dear user,</p>
        <p>This is a friendly reminder for your task:</p>
        <ul>
          <li><strong>Task:</strong> ${title}</li>
          <li><strong>Created On:</strong> ${new Date(created).toLocaleString()}</li>
          <li><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</li>
        </ul>
        <p>Please make sure to complete it before the deadline.</p>
        <p>Keep up the great work!</p>
        <p>Best regards,<br><strong>Day Craft Team</strong></p>
        <hr style="margin-top: 40px;">
        <p style="font-size: 12px; color: #888;">Day Craft</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Task reminder sent to ${email}:`, info.messageId);
    return info;
  } catch (error) {
    console.error(`Error sending task reminder to ${email}:`, error);
    throw new Error(`Failed to send task reminder: ${error.message}`);
  }
};


export { sendReminder };
