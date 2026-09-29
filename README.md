# ⭕ Neon Tic Tac Toe

A cool, readable Tic Tac Toe game. No frameworks, no build step — just HTML, CSS, and JS.
Ready to deploy on Vercel in 1 minute.

## ✨ Features

- 👥 2 Players mode + 🤖 vs Computer mode
- 🧠 Easy (random) + Hard (unbeatable minimax) difficulty
- 📊 Scoreboard (X / Draws / O)
- 🌈 Neon glassmorphism UI with animations
- 📱 Fully responsive
- 🏆 Winning-line highlight + win modal

## 📁 Files

```
tic-tac-toe/
├── index.html   → structure
├── style.css    → all styling (variables, grid, animations)
├── script.js    → game logic, well-commented
└── vercel.json  → Vercel config for static site
```

Code is intentionally simple and commented so you can read top-to-bottom:
`state → click handler → makeMove → check winner → AI (minimax) → UI helpers`.

## 🚀 Deploy to Vercel (3 ways)

### Option 1: Vercel Dashboard (easiest)
1. Push this `tic-tac-toe` folder to GitHub
2. Go to https://vercel.com/new
3. Import your repo, set **Root Directory** to `tic-tac-toe`
4. Framework Preset: **Other**. No build command. Click Deploy.

### Option 2: Vercel CLI
```bash
cd tic-tac-toe
npx vercel
```

### Option 3: Drag & Drop
Go to https://vercel.com/new → drag the `tic-tac-toe` folder in.

No environment variables or build settings needed.

## 🧑‍💻 Run locally

Just open `index.html` in a browser, or:

```bash
cd tic-tac-toe
npx serve .
```

## 🛠️ Customize

- Colors: edit `:root` variables in `style.css`
- Start player: change `currentPlayer` in `script.js`
- Board size: logic uses `WINNING_COMBOS`, easy to extend
