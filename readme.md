#  Slack SQL Data Bot

> A production-ready Slack bot that converts natural language questions into SQL queries using **LangChain + Google Gemini**, executes them on **PostgreSQL**, and returns beautifully formatted results directly in Slack.

---

##  Demo

```
User: /ask-data show revenue by region for 2025-09-01

Bot:  SQL Data Bot Result
     ─────────────────────────────
     Your Question:
     show revenue by region for 2025-09-01

     Generated SQL:
     SELECT region, SUM(revenue)
     FROM sales_daily
     WHERE date = '2025-09-01'
     GROUP BY region

     Results (3 total rows):
     region | sum
     ---    | ---
     North  | 125000.50
     South  | 54000.00
     West   | 40500.00
```

---

##  Features

-  **Natural Language to SQL** — Ask questions in plain English, get SQL back
-  **Google Gemini 2.5 Flash** — Fast and accurate NL→SQL conversion via LangChain
-  **PostgreSQL on Neon** — Serverless cloud database, zero setup
-  **Slack Block Kit UI** — Clean, formatted responses with headers, code blocks, and tables
-  **Error Handling** — Failed queries return the error message in a code block
-  **Slack Signature Verification** — Secure request validation with replay attack prevention
-  **Modular Architecture** — Agents, tools, services cleanly separated

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| AI / LLM | LangChain JS + Google Gemini 2.5 Flash |
| Database | PostgreSQL via Neon (serverless) |
| Slack | Slack Bolt SDK + Block Kit |
| Tunneling (dev) | ngrok |
| Config | dotenv |

---

##  Project Structure

```
slackSqlBot/
├── src/
│   ├── agents/
│   │   └── sqlAgent.ts          # Orchestrates generate → execute pipeline
│   ├── prompts/
│   │   └── sqlPrompt.ts         # LangChain prompt template for NL→SQL
│   ├── services/
│   │   ├── dbService.ts         # PostgreSQL connection pool + query execution
│   │   └── slackService.ts      # Block Kit response builders
│   ├── tools/
│   │   ├── generateSQLTool.ts   # LangChain tool: NL → SQL via Gemini
│   │   └── executeSQLTool.ts    # LangChain tool: SQL → PostgreSQL result
│   └── utils/
│       └── llm.ts               # Gemini LLM instance
├── app.ts                       # Express server + Slack slash command handler
├── .env                         # Environment variables (not committed)
├── .gitignore
├── package.json
└── tsconfig.json
```

---

##  Getting Started

### Prerequisites

- Node.js v18+
- A [Neon](https://neon.tech) account (free)
- A [Slack App](https://api.slack.com/apps) with slash commands enabled
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- [ngrok](https://ngrok.com) for local development

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/slackSqlBot.git
cd slackSqlBot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
GOOGLE_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb
DB_SSL=true
PORT=3000
```

| Variable | Where to get it |
|---|---|
| `SLACK_BOT_TOKEN` | Slack App → OAuth & Permissions |
| `SLACK_SIGNING_SECRET` | Slack App → Basic Information |
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `DATABASE_URL` | Neon dashboard → Connection string |

---

### 4. Set Up the Database

Run this in your **Neon SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.sales_daily (
  date        date            NOT NULL,
  region      text            NOT NULL,
  category    text            NOT NULL,
  revenue     numeric(12,2)   NOT NULL,
  orders      integer         NOT NULL,
  created_at  timestamptz     NOT NULL DEFAULT now(),
  PRIMARY KEY (date, region, category)
);

INSERT INTO public.sales_daily (date, region, category, revenue, orders) VALUES
('2025-09-01', 'North', 'Electronics', 125000.50, 310),
('2025-09-01', 'South', 'Grocery',      54000.00, 820),
('2025-09-01', 'West',  'Fashion',       40500.00, 190),
('2025-09-02', 'North', 'Electronics', 132500.00, 332),
('2025-09-02', 'West',  'Fashion',       45500.00, 210),
('2025-09-02', 'East',  'Grocery',       62000.00, 870);
```

---

### 5. Configure Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Your App
2. Navigate to **Slash Commands** → Create New Command
3. Set:
   - Command: `/ask-data`
   - Request URL: `https://your-ngrok-url.ngrok-free.app/slack/ask-data`
   - Short Description: `Ask data questions in natural language`
4. **Reinstall the app** to your workspace after saving

---

### 6. Run the App

Open **two terminals**:

```bash
# Terminal 1 — Start the server
npx ts-node app.ts

# Terminal 2 — Expose to internet
ngrok http 3000
```

Copy the ngrok URL and update your Slack slash command Request URL to:
```
https://xxxx.ngrok-free.app/slack/ask-data
```

---

##  Usage

Type any of these in Slack:

```
/ask-data show revenue by region for 2025-09-01
/ask-data total orders by category
/ask-data which region had the highest revenue
/ask-data top 3 categories by total revenue
/ask-data compare revenue between 2025-09-01 and 2025-09-02
/ask-data average orders per region
/ask-data show all sales from the North region
/ask-data which day had the most total orders
```

**Error test:**
```
/ask-data show data from employees table
```
Returns:
```
ERROR: relation "employees" does not exist
```

---

## 🏗 Architecture

```
Slack Slash Command
        │
        ▼
   app.ts (Express)
   POST /slack/ask-data
        │
        ├── Verify Slack Signature
        ├── ACK immediately (< 3s)
        │
        └── setImmediate (async)
                │
                ▼
        sqlAgent.ts
                │
                ├── generateSQLTool.ts
                │     └── Gemini LLM via LangChain
                │           └── sqlPrompt.ts
                │
                └── executeSQLTool.ts
                      └── dbService.ts (pg Pool)
                            └── Neon PostgreSQL
                │
                ▼
        slackService.ts
        Build Block Kit response
                │
                ▼
        POST response_url
        (Slack delayed response)
```

---

## 🔐 Security

- **Slack Signature Verification** — every request is verified using HMAC-SHA256
- **Replay Attack Prevention** — requests older than 5 minutes are rejected
- **Environment Variables** — no secrets in code, all via `.env`

---

## ⚠️ Known Limitations

- Designed for `sales_daily` table only (prompt is schema-specific)
- ngrok URL changes on every restart (free tier) — update Slack config each time
- No caching — every query hits Gemini API fresh


## 👤 Author

**Aditya Raj**  
Built as an internship assignment — Slack AI Data Bot MVP