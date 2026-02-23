import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ── Anthropic proxy — handles web_search tool loop ───────────────────────────
app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY not set. In Render: Dashboard → Your Service → Environment → Add ANTHROPIC_API_KEY' }
    });
  }
  try {
    let { model, max_tokens, tools, messages, system } = req.body;
    model      = model      || 'claude-sonnet-4-6';
    max_tokens = max_tokens || 8000;
    const allTextParts = [];
    let iterations = 0;
    while (iterations++ < 10) {
      const payload = { model, max_tokens, messages, tools: tools || [] };
      if (system) payload.system = system;
      const headers = {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      };
      // Only include web-search beta when tools are actually being used
      if (payload.tools && payload.tools.length > 0) {
        headers['anthropic-beta'] = 'web-search-2025-03-05';
      }
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await upstream.json();
      if (!upstream.ok || data.error) return res.json(data);
      (data.content || []).forEach(b => { if (b.type === 'text') allTextParts.push(b.text); });
      if (data.stop_reason !== 'tool_use') {
        return res.json({ content: [{ type: 'text', text: allTextParts.join('') }], stop_reason: 'end_turn', usage: data.usage });
      }
      // Tool loop — feed results back
      messages = [
        ...messages,
        { role: 'assistant', content: data.content },
        { role: 'user', content: (data.content || []).filter(b => b.type === 'tool_use').map(b => ({ type: 'tool_result', tool_use_id: b.id, content: '' })) },
      ];
    }
    return res.json({ content: [{ type: 'text', text: allTextParts.join('') }], stop_reason: 'end_turn' });
  } catch (err) {
    console.error('Claude proxy error:', err);
    res.status(500).json({ error: { message: err.message } });
  }
});

// ── FTCScout proxy — fixes CORS (browser can't call ftcscout.org directly) ───
app.post('/api/ftcscout', async (req, res) => {
  try {
    const upstream = await fetch('https://api.ftcscout.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: `FTCScout ${upstream.status}` });
    res.json(await upstream.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true, key: process.env.ANTHROPIC_API_KEY ? 'loaded' : 'MISSING' }));

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n🟠 CNP Scout → http://localhost:${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ MISSING'}\n`);
});
