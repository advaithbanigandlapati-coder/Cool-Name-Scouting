# CNP Scout — Desktop App
## AI-powered FTC alliance scouting for Cool Name Pending #30439

---

## What this is
A Windows desktop app (.exe) that:
1. **Pulls your Google Form responses** from Google Sheets in real-time
2. **Fetches live stats** (OPR, EPA, rank) from FTCScout for every team
3. **Runs Claude AI analysis** to rank every team OPTIMAL / MID / BAD vs your robot
4. **Gives you strategy tips** — what to do with them and against them

---

## First-time setup (do this before quals)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version). Just click Next through the installer.

### Step 2 — Install dependencies
Open a terminal in this folder (Shift+right-click → "Open PowerShell window here"):
```
npm install
```

### Step 3 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click "API Keys" → "Create Key"
4. Copy it — starts with `sk-ant-`

### Step 4 — Get your Google API key
1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Go to "APIs & Services" → "Library"
4. Search "Google Sheets API" → Enable it
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "API Key"
7. Copy it — starts with `AIza`

> **Important:** Make your Google Sheet viewable by anyone with the link
> (Share → "Anyone with the link" → Viewer)

### Step 5 — Get your Sheet ID
Open your Google Form's linked spreadsheet.
The URL looks like:
```
https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
```
Copy the long string between `/d/` and `/edit`.

### Step 6 — Run the app
```
npm run dev
```

### Step 7 — Configure in the app
1. Click **Settings** tab
2. Paste your Anthropic key, Google API key, Sheet ID
3. Click **"Load Column Headers"** — it'll pull your form's column names
4. Use the dropdowns to map each column to the right field
5. Set your robot's stats under "Our Robot Stats"
6. Click **Save Settings**

---

## At the qualifier

1. `npm run dev` to open the app
2. **Teams tab** → "Import from Sheets" to pull latest responses
3. Click "Fetch All FTCScout" to pull live rankings
4. **Alliance tab** → "Analyze Alliances" — Claude ranks everyone

---

## Build a .exe (to run without npm)

```
npm run dist
```

The installer will appear in the `release/` folder.
Double-click it to install, then CNP Scout appears in your Start Menu.

> First build requires downloading Electron (~80MB) — needs internet.

---

## Cost
- FTCScout data: **free**
- Claude analysis: ~**$0.03–0.08** per full event analysis
- Full qualifier season: probably **under $1**
