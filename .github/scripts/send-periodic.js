const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const vonageKey = process.env.VONAGE_API_KEY;
const vonageSecret = process.env.VONAGE_API_SECRET;
const vonageBrand = process.env.VONAGE_BRAND_NAME || 'VonageSMS';
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

  // 2. Send SMS Notification (Vonage)
  if (vonageKey && vonageSecret) {
    try {
      let formattedPhone = recipientPhone.trim();
      formattedPhone = formattedPhone.replace(/[-\s+]/g, '');
      if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }

      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          api_key: vonageKey,
          api_secret: vonageSecret,
          to: formattedPhone,
          from: vonageBrand,
          text: 'Periodic 5-Minute Notification: Everything is running smoothly!'
        })
      });

      const data = await response.json();

      if (data.messages && data.messages[0] && data.messages[0].status === '0') {
        console.log(`SMS successfully sent to ${formattedPhone} via Vonage. Message ID: ${data.messages[0]['message-id']}`);
      } else {
        const errMsg = data.messages && data.messages[0] ? data.messages[0]['error-text'] : 'Unknown error';
        console.error(`Vonage SMS delivery failed to ${formattedPhone}: ${errMsg}`);
      }
    } catch (err) {
      console.error('Error sending SMS via Vonage:', err.message);
    }
  } else {
    console.warn('Vonage credentials missing. Skipping SMS.');
  }
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
