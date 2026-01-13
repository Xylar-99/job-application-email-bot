#!/usr/bin/env node
/*
Automated email sender for IT company internship applications.
Reads from it_companies_parsed.json and sends personalized emails.

Usage:
  GMAIL_USER=you@gmail.com \
  GMAIL_APP_PASSWORD=xxxx xxxx \
  node send_bulk_intern_emails.js

Or with .env file containing:
  GMAIL_USER=your.email@gmail.com
  GMAIL_APP_PASSWORD=your_app_password
*/

import fs from 'fs-extra';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------
// Configuration
// ---------------------------
const CONFIG = {
  DELAY_BETWEEN_EMAILS: 120000 / 2, // 2 minutes
  
  // Path to your CV
  CV_PATH: '/home/xylar-99/Desktop/data/enginner_cv/Abdelbassat_Quaoubai_FullStack_Engineer_CV.pdf',
  
  // Path to IT companies JSON
  COMPANIES_JSON: './emails/emails.json',
  
  // Log file to track sent emails
  LOG_FILE: './emails/sent_emails_log.json',
  
  // Your contact info
  YOUR_NAME: 'Abdelbassat Quaoubai',
  YOUR_PHONE: '+212 715 822 574',
  YOUR_GITHUB: 'https://github.com/xylar-99',
  YOUR_SCHOOL: '1337'
};

// ---------------------------
// Create Transport
// ---------------------------
async function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables or .env file");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass }
  });
}

// ---------------------------
// Email Templates
// ---------------------------
function getEmailSubject() {
  return "Internship Application: Fullstack / Web Development Intern Position";
}

function createPersonalizedEmail(founderName, companyName) 
{
  // Clean up founder name (remove any titles)
  const cleanName = founderName
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|M\.|Mme\.)\s*/i, '')
    .trim();
  
  // Greeting based on whether we have a name
  let greeting;
  if (cleanName && cleanName !== 'N/A') {
    greeting = `Dear ${cleanName}`;
  } else if (companyName && companyName !== 'N/A') {
    greeting = `Dear ${companyName} team`;
  } else {
    greeting = `Dear Hiring Manager`;
  }

  return `${greeting},

My name is xylaaaaaaaaaaaaa Quaoubai, a full-stack development student at 1337. I am looking for a Web Development / Fullstack internship.

I work with React.js for frontend and NestJS + Fastify for backend. I can build APIs, authentication systems, dashboards, and full web applications. I enjoy writing clean code, solving problems, and learning new tools quickly.

I am motivated, serious, and able to work on real projects. I have attached my resume so you can see my skills and previous work.

Thank you for taking the time to read my message.  
I hope to get the chance to join your team and contribute.

Best regards,  
Abdelbassat Quaoubai  
+212 715 822 574  
GitHub: https://github.com/xylar-99`;
}

// ---------------------------
// Send Email Function
// ---------------------------
async function sendEmail(to, founderName, companyName) {
  const subject = getEmailSubject();
  const text = createPersonalizedEmail(founderName, companyName);
  
  const transporter = await createTransport();
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: subject,
    text: text,
    attachments: []
  };

  // Attach CV if it exists
  if (fs.existsSync(CONFIG.CV_PATH)) {
    mailOptions.attachments.push({
      filename: path.basename(CONFIG.CV_PATH),
      content: fs.readFileSync(CONFIG.CV_PATH)
    });
  } else {
    console.warn(`⚠️  CV file not found at: ${CONFIG.CV_PATH}`);
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// ---------------------------
// Logging Functions
// ---------------------------
async function loadSentLog() 
{
  try {
    if (fs.existsSync(CONFIG.LOG_FILE)) {
      return await fs.readJSON(CONFIG.LOG_FILE);
    }
  } 
  catch (error) {
    console.warn('Could not load sent log:', error.message);
  }
  return { sent: [], failed: [] };
}

async function saveSentLog(log) {
  await fs.writeJSON(CONFIG.LOG_FILE, log, { spaces: 2 });
}

async function addToLog(log, email, companyName, status, error = null) 
{
  const entry = {
    email,
    companyName,
    timestamp: new Date().toISOString(),
    status,
    error: error ? error.message : null
  };

  if (status === 'success') {
    log.sent.push(entry);
  } else {
    log.failed.push(entry);
  }

  await saveSentLog(log);
}

// ---------------------------
// Sleep Function
// ---------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------
// Main Bulk Send Function
// ---------------------------
async function sendBulkEmails() 
{
  console.log('🚀 Starting bulk email sending process...\n');
  
  // Load companies
  let companies;
  try 
  {
    companies = await fs.readJSON(CONFIG.COMPANIES_JSON);
    console.log(`📊 Loaded ${companies.length} companies from database\n`);
  } 
  catch (error) {
    console.error(`❌ Error loading companies file: ${error.message}`);
    process.exit(1);
  }

  // Load sent log
  const log = await loadSentLog();
  const alreadySent = new Set(log.sent.map(e => e.email));
  
  console.log(`📝 Already sent to ${alreadySent.size} companies\n`);

  // Filter companies that haven't been emailed yet
  const toSend = companies.filter(c => 
    c.email && 
    c.email !== 'N/A' && 
    !alreadySent.has(c.email) &&
    c.email.includes('@') // Basic validation
  );

  console.log(`📧 Will send to ${toSend.length} new companies\n`);
  console.log(`⏱️  Estimated time: ${Math.round(toSend.length * CONFIG.DELAY_BETWEEN_EMAILS / 60000)} minutes\n`);
  
  if (toSend.length === 0) {
    console.log('✅ No new companies to email!');
    return;
  }

  // Confirm before starting
  console.log('📋 Preview of first 5 companies:');
  toSend.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.companyName} - ${c.email}`);
  });
  console.log('');

  // Start sending
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toSend.length; i++) {
    const company = toSend[i];
    const progress = `[${i + 1}/${toSend.length}]`;
    
    try {
      console.log(`${progress} Sending to: ${company.companyName}`);
      console.log(`   📧 Email: ${company.email}`);
      console.log(`   👤 Contact: ${company.founderName}`);
      
      await sendEmail(company.email, company.founderName, company.companyName);
      
      await addToLog(log, company.email, company.companyName, 'success');
      successCount++;
      
      console.log(`   ✅ Sent successfully!\n`);
      
      // Wait before sending next email (except for the last one)
      if (i < toSend.length - 1) {
        const delayMinutes = Math.round(CONFIG.DELAY_BETWEEN_EMAILS / 60000);
        console.log(`   ⏳ Waiting ${delayMinutes} minutes before next email...\n`);
        await sleep(CONFIG.DELAY_BETWEEN_EMAILS);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      await addToLog(log, company.email, company.companyName, 'failed', error);
      failCount++;
      
      // Still wait before trying next one
      if (i < toSend.length - 1) {
        await sleep(CONFIG.DELAY_BETWEEN_EMAILS);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SENDING SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully sent: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total processed: ${successCount + failCount}`);
  console.log(`📋 Log saved to: ${CONFIG.LOG_FILE}`);
  console.log('='.repeat(50) + '\n');
}

// ---------------------------
// CLI - Send to Single Email
// ---------------------------
async function sendSingleEmail(email, companyName = '', founderName = '') {
  console.log(`📧 Sending single email to: ${email}\n`);
  
  try {
    await sendEmail(email, founderName, companyName);
    console.log(`✅ Email sent successfully to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send: ${error.message}`);
    process.exit(1);
  }
}

// ---------------------------
// CLI Argument Parsing
// ---------------------------
function printUsage() {
  console.log(`
📧 IT Companies Internship Email Sender

Usage:
  # Send to all companies in database:
  node send_bulk_intern_emails.js

  # Send to single email (test):
  node send_bulk_intern_emails.js --to=hr@example.com --name="Company Name" --founder="John Doe"

Options:
  --to          Recipient email address (single test email)
  --name        Company name (optional)
  --founder     Founder/contact name (optional)
  --help        Show this help message

Environment Variables (required):
  GMAIL_USER              Your Gmail address
  GMAIL_APP_PASSWORD      Your Gmail app password

Example:
  GMAIL_USER=you@gmail.com GMAIL_APP_PASSWORD=xxxx node send_bulk_intern_emails.js
`);
}

function parseArgs(argv) {
  const res = { to: null, companyName: '', founderName: '', help: false };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      res.help = true;
    } else if (arg.startsWith('--to=')) {
      res.to = arg.slice(5);
    } else if (arg.startsWith('--name=')) {
      res.companyName = arg.slice(7);
    } else if (arg.startsWith('--founder=')) {
      res.founderName = arg.slice(10);
    }
  }

  return res;
}

// ---------------------------
// Main Entry Point
// ---------------------------
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (args.to) {
  // Send single test email
  await sendSingleEmail(args.to, args.companyName, args.founderName);
} else {
  // Send to all companies
  await sendBulkEmails();
}
