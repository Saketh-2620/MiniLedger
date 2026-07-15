# Mini-Ledger

A lightweight full-stack personal finance tracker. Add and categorise income and expenses, view a live dashboard summary, and receive automated email notifications for large transactions and periodic reports.

**Live:** [mini-ledger-lake.vercel.app](https://mini-ledger-lake.vercel.app)
** please note that backend takes 50 sec to laod for the first time after a long period of inactivity as its hosted on render free tier

**How AI Accelerated to work**
Listed down the requirements and desined the Schema to suit the requirements which made it easy to genreate he CRUD with AI on those schemas

**Human Judgment**
* Authentication - AI suggested the standatard JWT, I went with Google Auth as it helps me in the later part to send notifications without having to verifiy email for the notifications
* Frontend has been taken care to look professional with better UI library, clear requirements
* Additional feature that AI dint suggest - Sending weekly and monthly reports
* Deployment 

---

Tech Stack


 Frontend -> React 18, Vite, Material UI v5 
 Backend -> Node.js, Express 
 Database -> PostgreSQL 
 Auth -> Google OAuth 2.0 + JWT 
 Email -> SendGrid HTTP API 
 Hosting -> Vercel (frontend), Render (backend) 

---

## Features

### Authentication
- Sign in with Google

### Dashboard
- Summary cards showing total income, total expenses, net balance, and transaction count for the current month
- Per-category breakdown with income/expense totals
- Recent 5 transactions preview
- Date range defaults to the current calendar month; supports custom ranges via query params

### Transactions
- Add, edit, and delete transactions
- Each transaction has: type (income/expense), amount (INR), date, category, and an optional description
- Filter by type and category
- Paginated table (10 per page)
- Transactions above a configurable threshold trigger an instant email alert

### Categories
- Create, rename, and delete custom categories
- Categories are type-neutral — the same category (e.g. "Others") can be used for both income and expense transactions
- 10 default categories seeded automatically on first login: Salary, Freelance, Rent, Food, Transport, Entertainment, Healthcare, Utilities, Others, Transfers
- Deleting a category sets existing transactions to uncategorised (no data loss)

### Email Notifications (SendGrid) (Check spam folder for emails)
- **Large transaction alert** — sent immediately when a transaction exceeds the configured threshold (default ₹1,000)
- **Weekly summary** — sent every Monday at 8 AM with the past 7 days' income, expenses, and net balance
- **Monthly report** — sent on the 1st of each month with the previous month's full breakdown by category
- All notification attempts are logged in the database with `pending`, `sent`, or `failed` status
- Notification history is viewable in the app under the Notifications page

---




---

## Database Schema

```
users               — Google ID, email, name, avatar URL
categories          — user-owned, name only (no type coupling)
transactions        — type, amount, date, description, category FK, user FK
refresh_tokens      — hashed tokens with expiry
notification_logs   — type, status (pending/sent/failed), metadata, sent_at
```


## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A Google Cloud project with OAuth 2.0 credentials
- A SendGrid account (free tier: 100 emails/day)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd MiniLedger

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=miniledger
DB_USER=postgres
DB_PASSWORD=your_password

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_secret
SESSION_SECRET=any_random_string

# Google OAuth — https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:5173

# SendGrid — https://sendgrid.com → Settings → API Keys
SENDGRID_API_KEY=SG.your_api_key
MAIL_FROM=your_verified_sender@gmail.com

# Amount above which an instant email alert is sent (in INR)
LARGE_TXN_THRESHOLD=1000
```

Fill in `frontend/.env`:

```env
# Leave empty for local dev — Vite proxies /api to localhost:5000
VITE_API_BASE_URL=
```

### 3. Create the database and run migrations

```bash
createdb miniledger          # or create via psql / pgAdmin
cd backend && npm run migrate
```

### 4. Start both servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

### 5. Google OAuth — add authorised redirect URI

In Google Cloud Console → OAuth credentials → Authorised redirect URIs, add:
```
http://localhost:5000/api/auth/google/callback
```

---



