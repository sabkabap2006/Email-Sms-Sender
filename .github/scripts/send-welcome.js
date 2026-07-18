const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const recipientEmail = process.env.RECIPIENT_EMAIL;
const recipientName = process.env.RECIPIENT_NAME || 'Valued Customer';

async function main() {
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are required');
  }
  if (!recipientEmail) {
    throw new Error('RECIPIENT_EMAIL environment variable is required');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass }
  });

  const templatePath = path.join(process.cwd(), '.github', 'templates', 'welcome-email.html');
  let htmlBody = `<h2>Hello ${recipientName}</h2><p>Welcome to our service.</p><a href="https://example.com">Open Website</a>`;
  
  if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, 'utf8');
    htmlBody = template.replace(/\{\{name\}\}/g, recipientName);
  }

  await transporter.sendMail({
    from: `"Welcome Team" <${smtpUser}>`,
    to: recipientEmail,
    subject: 'Welcome to Our Service!',
    html: htmlBody
  });

  console.log(`Welcome email successfully sent to ${recipientEmail}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
