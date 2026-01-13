#!/usr/bin/env node

import fs from 'fs-extra';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  DELAY_MINUTES: 1,
  CV_PATH: './test_cv.pdf',
  COMPANIES_JSON: './emails/emails.json',
  LOG_FILE: './emails/sent_emails_log.json'
};



function createTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { 
      user: process.env.GMAIL_USER, 
      pass: process.env.GMAIL_APP_PASSWORD 
    }
  });
}

function createEmail(founderName, companyName) 
{
  const name = founderName?.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|M\.|Mme\.)\s*/i, '').trim();
  let greeting = 'Dear Hiring Manager';
  
  if (name && name !== 'N/A') {
    greeting = `Dear ${name}`;
  } else if (companyName && companyName !== 'N/A') {
    greeting = `Dear ${companyName} team`;
  }

  return {
    subject: 'Internship Application - Full Stack Developer',
    body: `${greeting},

I am a full-stack developer looking for an internship opportunity.

I have experience with React.js, Node.js, and modern web development. I am motivated to learn and contribute to your team.

Please find my CV attached.

Best regards`
  };
}



async function sendEmail(to, founderName, companyName) 
{
  const email = createEmail(founderName, companyName);
  const transporter = createTransport();
  
  const options = {
    from: process.env.GMAIL_USER,
    to,
    subject: email.subject,
    text: email.body,
    attachments: fs.existsSync(CONFIG.CV_PATH) ? [{ path: CONFIG.CV_PATH }] : []
  };

  return await transporter.sendMail(options);
}



async function loadLog() {
  if (fs.existsSync(CONFIG.LOG_FILE)) {
    return await fs.readJSON(CONFIG.LOG_FILE);
  }
  return { sent: [], failed: [] };
}

async function saveLog(log) {
  await fs.writeJSON(CONFIG.LOG_FILE, log, { spaces: 2 });
}

function sleep(minutes) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60000));
}

async function sendBulkEmails() {
  const companies = await fs.readJSON(CONFIG.COMPANIES_JSON);
  const log = await loadLog();
  const alreadySent = new Set(log.sent.map(e => e.email));
  
  const toSend = companies.filter(c => {
    const email = c.email || c.EntrepriseContactEmail;
    return email && email !== 'N/A' && !alreadySent.has(email) && email.includes('@');
  });

  console.log(`📧 Sending to ${toSend.length} companies\n`);
  
  for (let i = 0; i < toSend.length; i++) {
    const company = toSend[i];
    const email = company.email || company.EntrepriseContactEmail;
    const companyName = company.companyName || company.EntrepriseName;
    const founderName = company.founderName || company.EntrepriseContactName;
    
    try {
      console.log(`[${i + 1}/${toSend.length}] ${companyName} - ${email}`);
      await sendEmail(email, founderName, companyName);
      
      log.sent.push({
        email: email,
        companyName: companyName,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Sent\n');
      
      if (i < toSend.length - 1) {
        console.log(`⏳ Waiting ${CONFIG.DELAY_MINUTES} minute(s)...\n`);
        await sleep(CONFIG.DELAY_MINUTES);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      log.failed.push({
        email: email,
        companyName: companyName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    await saveLog(log);
  }

  console.log(`\n✅ Sent: ${log.sent.length} | ❌ Failed: ${log.failed.length}`);
}

function showHelp() {
  console.log(`
📧 Email Sender for Internship Applications

USAGE:
  node send_bulk_intern_emails.js          Send to all companies
  node send_bulk_intern_emails.js --help   Show this help

SETUP:
  1. Create .env file with:
     GMAIL_USER=your@gmail.com
     GMAIL_APP_PASSWORD=your_app_password
  
  2. Add companies to: ${CONFIG.COMPANIES_JSON}
  3. Add your CV: ${CONFIG.CV_PATH}
  
  4. Run: node send_bulk_intern_emails.js

SETTINGS:
  Delay between emails: ${CONFIG.DELAY_MINUTES} minute(s)
`);
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  await sendBulkEmails();
}
