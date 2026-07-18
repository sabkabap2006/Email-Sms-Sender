const nodemailer = require('nodemailer');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const recipientEmail = process.env.RECIPIENT_EMAIL || 'sayantanpal20061974@gmail.com';
const recipientPhone = process.env.RECIPIENT_PHONE || '+916290359386';

async function main() {
  console.log('Starting periodic message dispatch...');

  // 1. Send Email Notification
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });

      // Load welcome-email template
      const templatePath = path.join(process.cwd(), '.github', 'templates', 'welcome-email.html');
      let htmlBody = `<h2>Hello Periodic User</h2><p>Welcome to our service.</p><a href="https://example.com">Open Website</a>`;
      
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, 'utf8');
        htmlBody = template.replace(/\{\{name\}\}/g, 'Periodic Subscriber');
      }

      await transporter.sendMail({
        from: `"Periodic Monitor" <${smtpUser}>`,
        to: recipientEmail,
        subject: 'Periodic 5-Minute Notification',
        html: htmlBody
      });
      console.log(`Email successfully sent to ${recipientEmail}`);
    } catch (err) {
      console.error('Error sending email:', err.message);
    }
  } else {
    console.warn('SMTP credentials missing. Skipping email.');
  }

  // 2. Send SMS Notification
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const client = twilio(twilioSid, twilioToken);
      let formattedPhone = recipientPhone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      }

      const message = await client.messages.create({
        body: 'Periodic 5-Minute Notification: Everything is running smoothly!',
        from: twilioPhone,
        to: formattedPhone
      });
      console.log(`SMS successfully sent to ${formattedPhone}. SID: ${message.sid}`);
    } catch (err) {
      console.error('Error sending SMS:', err.message);
    }
  } else {
    console.warn('Twilio credentials missing. Skipping SMS.');
  }
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
