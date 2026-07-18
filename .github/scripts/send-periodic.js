const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'MSGIND';
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

  // 2. Send SMS Notification (MSG91)
  if (msg91AuthKey && msg91TemplateId) {
    try {
      let formattedPhone = recipientPhone.trim();
      formattedPhone = formattedPhone.replace(/[-\s+]/g, '');
      if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': msg91AuthKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: msg91TemplateId,
          sender: msg91SenderId,
          recipients: [
            {
              mobiles: formattedPhone,
              name: 'Periodic Subscriber',
              message: 'Periodic 5-Minute Notification: Everything is running smoothly!'
            }
          ]
        })
      });

      const data = await response.json();

      if (data.type === 'success') {
        console.log(`SMS successfully sent to ${formattedPhone} via MSG91. Request ID: ${data.request_id}`);
      } else {
        console.error(`MSG91 SMS delivery failed to ${formattedPhone}: ${data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error('Error sending SMS via MSG91:', err.message);
    }
  } else {
    console.warn('MSG91 credentials missing. Skipping SMS.');
  }
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
