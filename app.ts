import express , { Request, Response, NextFunction } from 'express';
import* as  dotenv from 'dotenv';
import { runSQLAgent } from './src/agents/sqlAgent';
import { buildSuccessBlocks, buildErrorBlocks } from './src/services/slackService';
import { testConnection } from './src/services/dbService';
import crypto from 'crypto';
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(
  express.urlencoded({ extended: true }),
);
app.use(express.json());
function verifySlackSignature(req: Request, res: Response, next: NextFunction): void {
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET ?? '';
  const slackSignature = req.headers['x-slack-signature'] as string;
  const slackTimestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!slackSignature || !slackTimestamp) {
    res.status(401).json({ error: 'Missing Slack signature headers' });
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(slackTimestamp)) > 300) {
    res.status(401).json({ error: 'Request timestamp too old' });
    return;
  }

  const rawBody = new URLSearchParams(req.body).toString();
  const sigBaseString = `v0:${slackTimestamp}:${rawBody}`;
  const mySignature =
    'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBaseString).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
    res.status(401).json({ error: 'Invalid Slack signature' });
    return;
  }

  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/slack/ask-data', verifySlackSignature, async (req: Request, res: Response) => {
  const { text: question, user_name } = req.body as { text: string; user_name: string };

  if (!question || !question.trim()) {
    res.json({
      response_type: 'ephemeral',
      text: `⚠️ Please provide a question. Usage: \`/ask-data show me total revenue by region\``,
    });
    return;
  }

  console.log(`[/ask-data] User: ${user_name} | Question: "${question}"`);
  res.json({
    response_type: 'ephemeral',
    text: `🔄 Processing your query: _"${question}"_ ...`,
  });
  const responseUrl = req.body.response_url as string;

  setImmediate(async () => {
    try {
      const { sql, result } = await runSQLAgent(question);
      const blocks = buildSuccessBlocks(question, sql, result);

      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'in_channel',
          blocks,
        }),
      });

      console.log(`[/ask-data] Success | Rows: ${result.rowCount} | SQL: ${sql}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error(`[/ask-data] Error:`, message);

      const blocks = buildErrorBlocks(question, message);

      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          blocks,
        }),
      });
    }
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`⚡️ Server running on port ${PORT}`);
      console.log(`📡 Slack endpoint: POST /slack/ask-data`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();