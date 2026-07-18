# Register & Subscribe Full-Stack Application

A minimal, full-stack application built with a modern React + Tailwind CSS client, a Node.js + Express backend connected to MongoDB, and automated notifications (Email and SMS).

## Repository Architecture

- **`frontend/`**: React, Vite, and Tailwind CSS v4 registration form UI.
- **`backend/`**: Express server communicating with local MongoDB (Mongoose models) and sending emails/SMS.
- **`.github/`**: Email HTML templates and GitHub Actions workflow schedules.

---

## Local Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (running locally on port `27017`)

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` folder:
```text
PORT=5001
MONGODB_URI=mongodb://localhost:27017/registration_db
SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Launch the Backend
```bash
cd backend
npm install
npm run dev
```
*The server will start at `http://localhost:5001`.*

### 4. Launch the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The React client will start at `http://localhost:5173`.*

---

## Features & Automations
- **Form Verification**: Performs real-time field validation (Full Name length, valid Email regex, and 10-digit Phone numbers).
- **Auto-Welcoming**: Dispatches a beautiful HTML template welcome email (via SMTP) and greeting SMS (via Twilio) instantly on successful user registrations.
- **Periodic Broadcasts**: Set up with `.github/workflows/periodic-reminder.yml` to trigger every 5 minutes and verify system status / notify users.
