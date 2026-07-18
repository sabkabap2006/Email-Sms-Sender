import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/registration_db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => {
    console.error('MongoDB connection warning. Please make sure MongoDB is running:')
    console.error(err.message)
  })

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

// Configure Nodemailer with your Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Verify email credentials configuration at startup
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error('SMTP configuration error:', error.message)
    } else {
      console.log('SMTP server is ready to deliver messages')
    }
  })
}

// Log status of MSG91 SMS credentials on start
const hasMsg91Creds = (
  process.env.MSG91_AUTH_KEY && 
  process.env.MSG91_AUTH_KEY !== 'your_msg91_auth_key'
)

if (hasMsg91Creds) {
  console.log('MSG91 SMS configurations detected')
} else {
  console.log('MSG91 credentials not fully configured. SMS will run in SIMULATION mode.')
}

// Helper to send SMS via MSG91 Flow API (formats phone and dispatches/simulates)
const sendSMS = async (phone, body, variables = {}) => {
  let formattedPhone = phone.trim()
  // MSG91 expects number in international format without leading + (e.g. 919876543210)
  formattedPhone = formattedPhone.replace(/[-\s+]/g, '')
  if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`
  }

  const liveCreds = (
    process.env.MSG91_AUTH_KEY && 
    process.env.MSG91_AUTH_KEY !== 'your_msg91_auth_key'
  )

  if (liveCreds) {
    try {
      const templateId = process.env.MSG91_TEMPLATE_ID
      const senderId = process.env.MSG91_SENDER_ID || 'MSGIND'

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          sender: senderId,
          recipients: [
            {
              mobiles: formattedPhone,
              // Bind custom variable parameters depending on DLT template setup
              name: variables.name || 'User',
              message: body
            }
          ]
        })
      })

      const data = await response.json()

      if (data.type === 'success') {
        console.log(`SMS successfully sent to ${formattedPhone} via MSG91. Request ID: ${data.request_id}`)
        return { success: true, requestId: data.request_id }
      } else {
        console.error(`MSG91 SMS delivery failed to ${formattedPhone}: ${data.message || JSON.stringify(data)}`)
        return { success: false, error: data.message || 'Unknown MSG91 error' }
      }
    } catch (err) {
      console.error(`Failed to send SMS to ${formattedPhone} via MSG91:`, err.message)
      return { success: false, error: err.message }
    }
  } else {
    console.log(`[MSG91 SMS SIMULATION] To: ${formattedPhone} | Message: ${body}`)
    return { success: true, simulated: true }
  }
}

// User Schema & Model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  phone: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  subscribed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const User = mongoose.model('User', UserSchema)

// Helper to fetch and interpolate the HTML template
const getEmailTemplate = (name) => {
  try {
    const templatePath = path.join(__dirname, '..', '..', '.github', 'templates', 'welcome-email.html')
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8')
      return template.replace(/\{\{name\}\}/g, name)
    }
  } catch (err) {
    console.error('Error reading welcome-email.html template:', err)
  }
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2>Hello ${name}</h2>
      <p>Welcome to our service.</p>
      <p><a href="https://example.com" style="background-color:#6366f1;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Open Website</a></p>
    </div>
  `
}

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPhone = (phone) => {
  return /^[0-9]{10}$/.test(phone.replace(/[-\s]/g, ''))
}

// 1. POST /register - Register a new user
app.post('/register', async (req, res) => {
  const { name, phone, email, subscribe } = req.body

  const errors = {}
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }
  if (!phone || !isValidPhone(phone)) {
    errors.phone = 'A valid 10-digit mobile number is required'
  }
  if (!email || !isValidEmail(email)) {
    errors.email = 'A valid email address is required'
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors })
  }

  try {
    const newUser = new User({
      name: name.trim(),
      phone: phone.replace(/[-\s]/g, ''),
      email: email.trim().toLowerCase(),
      subscribed: !!subscribe
    })

    await newUser.save()

    // Send Welcome Email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const htmlBody = getEmailTemplate(newUser.name)
      transporter.sendMail({
        from: `"Welcome Team" <${process.env.SMTP_USER}>`,
        to: newUser.email,
        subject: 'Welcome to Our Service!',
        html: htmlBody
      }).then(() => {
        console.log(`Welcome email successfully dispatched to ${newUser.email}`)
      }).catch(err => {
        console.error(`Failed to send welcome email to ${newUser.email}:`, err.message)
      })
    }

    // Send Welcome SMS (MSG91)
    const smsBody = `Hi ${newUser.name}, thank you for registering with us! We have set up your profile.`
    sendSMS(newUser.phone, smsBody, { name: newUser.name })

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        subscribed: newUser.subscribed,
        createdAt: newUser.createdAt
      }
    })
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email'
      return res.status(409).json({
        success: false,
        message: `A user with this ${field === 'phone' ? 'mobile number' : 'email'} is already registered.`
      })
    }
    
    console.error('Error saving user:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred.'
    })
  }
})

// 2. GET /users - Get all registered users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve registered users' })
  }
})

// 3. POST /send - Send a notification/newsletter to subscribed users (Email campaign)
app.post('/send', async (req, res) => {
  const { subject, message } = req.body

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({ success: false, message: 'Subject is required' })
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required' })
  }

  try {
    const subscribers = await User.find({ subscribed: true })

    if (subscribers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active subscribers found to send message to.',
        sentCount: 0,
        recipients: []
      })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(503).json({
        success: false,
        message: 'SMTP credentials are not configured on the server.'
      })
    }

    console.log(`Sending message: "${subject}" to ${subscribers.length} subscribers...`)

    const mailPromises = subscribers.map(user => {
      return transporter.sendMail({
        from: `"Notification Center" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e4e7; border-radius: 8px;">
            <h2 style="color: #6366f1;">Hello ${user.name}</h2>
            <p>${message}</p>
            <p style="margin: 25px 0;">
              <a href="https://example.com" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Visit Website
              </a>
            </p>
          </div>
        `
      })
    })

    const results = await Promise.allSettled(mailPromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length

    res.json({
      success: true,
      message: `Campaign broadcast complete. Dispatched: ${successCount}, Failed: ${failedCount}`,
      sentCount: successCount,
      failedCount: failedCount,
      recipients: subscribers.map(s => ({ name: s.name, email: s.email }))
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    res.status(500).json({ success: false, message: 'An error occurred during communication broadcast.' })
  }
})

// 4. POST /send-sms - Send an SMS message to registered users (SMS campaign)
app.post('/send-sms', async (req, res) => {
  const { message, phone } = req.body

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required' })
  }

  try {
    if (phone) {
      // Send message to a single number
      const result = await sendSMS(phone, message)
      return res.json({
        success: result.success,
        message: result.success ? 'SMS sent successfully.' : `SMS delivery failed: ${result.error}`,
        details: result
      })
    }

    // Send to all registered users
    const users = await User.find({})
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No registered users found to send SMS campaign.',
        sentCount: 0
      })
    }

    console.log(`Broadcasting SMS to ${users.length} users...`)
    const smsPromises = users.map(user => sendSMS(user.phone, message, { name: user.name }))
    const results = await Promise.all(smsPromises)

    const successCount = results.filter(r => r.success).length
    res.json({
      success: true,
      message: `SMS campaign complete. Dispatched: ${successCount}, Failed: ${users.length - successCount}`,
      sentCount: successCount
    })
  } catch (error) {
    console.error('Error executing SMS campaign:', error)
    res.status(500).json({ success: false, message: 'An error occurred during SMS campaign broadcast.' })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
