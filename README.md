# Job Application Email Bot

Automated email sender for internship applications. Send personalized emails to multiple companies with your CV attached.

## Features

- 📧 Send bulk emails to multiple companies
- ⏱️ Configurable delay between emails
- 📎 Automatically attach your CV
- 📝 Track sent and failed emails
- 🔄 Skip already-contacted companies

## Prerequisites

- Node.js (v14 or higher)
- Gmail account
- Gmail App Password

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Gmail App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Sign in to your Google account
3. Select app: **Mail**
4. Select device: **Other (Custom name)** - enter "Email Bot"
5. Click **Generate**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 3. Create `.env` File

Create a `.env` file in the project root:

```env
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

⚠️ **Important**: Replace with your actual email and the app password from step 2.

### 4. Add Your CV

Place your CV file in the project root and name it `cv.pdf`, or update the `CV_PATH` in the script:

```javascript
CV_PATH: './cv.pdf'
```

### 5. Add Companies Data

Edit `emails/emails.json` with your company list. The script supports two formats:

**Format 1** (Simple):
```json
[
  {
    "companyName": "Tech Company",
    "email": "hr@example.com",
    "founderName": "John Doe"
  }
]
```

**Format 2** (Extended):
```json
[
  {
    "EntrepriseName": "Tech Company",
    "EntrepriseContactEmail": "hr@example.com",
    "EntrepriseContactName": "John Doe"
  }
]
```

## Usage

### Send Emails to All Companies

```bash
node send_bulk_intern_emails.js
```

### Show Help

```bash
node send_bulk_intern_emails.js --help
```

## Configuration

Edit these settings in `send_bulk_intern_emails.js`:

```javascript
const CONFIG = {
  DELAY_MINUTES: 1,              // Minutes between each email
  CV_PATH: './cv.pdf',           // Path to your CV
  COMPANIES_JSON: './emails/emails.json',
  LOG_FILE: './emails/sent_emails_log.json'
};
```

## Customizing the Email

Edit the `createEmail()` function to customize your message:

```javascript
function createEmail(founderName, companyName) {
  return {
    subject: 'Your Subject Here',
    body: `Your message here...`
  };
}
```

## Log Files

The script automatically tracks sent emails in `emails/sent_emails_log.json`:

```json
{
  "sent": [
    {
      "email": "hr@example.com",
      "companyName": "Tech Company",
      "timestamp": "2026-01-13T12:00:00.000Z"
    }
  ],
  "failed": []
}
```

The script will skip companies already in the "sent" list.

## Troubleshooting

### Authentication Error

- Make sure you're using an **App Password**, not your regular Gmail password
- Verify your `.env` file has the correct credentials
- Check that "Less secure app access" is not needed (App Passwords bypass this)

### CV Not Attaching

- Verify the CV file exists at the path specified in `CV_PATH`
- Check file permissions

### JSON Syntax Error

- Validate your `emails.json` file at [jsonlint.com](https://jsonlint.com)
- Remove trailing commas
- Ensure all strings are in double quotes

## Safety Tips

⚠️ **Important Safety Guidelines:**

1. **Delay Between Emails**: Keep at least 1-2 minutes between emails to avoid being flagged as spam
2. **Daily Limits**: Gmail has a daily sending limit (~500 emails/day for regular accounts)
3. **Test First**: Send test emails to yourself before bulk sending
4. **Backup**: Keep a backup of your companies list
5. **Monitor**: Check the log file regularly for failed sends

## Example Workflow

1. **Prepare**: Add 10-20 companies to `emails.json`
2. **Test**: Send a test email to yourself first
3. **Review**: Check that the email looks good
4. **Send**: Run the script for the full list
5. **Monitor**: Watch the console output for any errors
6. **Follow-up**: Check `sent_emails_log.json` to see results

## License

ISC
