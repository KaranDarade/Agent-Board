# ⚡ Agent Board (Universal Hub)

A high-performance **Multi-Tool AI Coding Agent Fleet Manager** with a luxury **Black, Gold & White** aesthetic, full **Dark & Light theme** support, real-time cross-tool session tracking, and 24/7 mobile access.

Auto-discovers and orchestrates agents across:
* **OpenCode** (`~/.local/share/opencode/opencode.db`)
* **Cursor AI** (`%APPDATA%/Cursor/User/workspaceStorage`)
* **Antigravity** (`~/.gemini/antigravity/brain`)
* **Claude Code** (`~/.claude`)

---

## ✨ Features

- 🎨 **Black, Gold & White Palette**:
  - **Dark Mode**: Obsidian black (`#07090E`), onyx surfaces, metallic gold borders (`#D4AF37`), gold glows, crisp white typography.
  - **Light Mode**: Crisp alabaster (`#FAFAF9`), soft ivory cards, metallic gold trims, high contrast dark typography.
  - **Instant Theme Switcher**: Sun/Moon toggle with `localStorage` persistence.
- 🔍 **Multi-Tool Auto Discovery**:
  - Automatically scans your PC for OpenCode, Cursor, Antigravity, and Claude Code.
  - Normalizes 230+ sessions into a unified fleet view.
- 🏷️ **Clear Agent Categorization**:
  - **Engine Filter**: Filter by `OpenCode`, `Cursor AI`, `Antigravity`, `Claude Code`, or view `All Engines`.
  - **Role Filter**: `BUILD` (Engineering), `PLAN` (Architect), `EXPLORE` (Research), `GENERAL` (Core).
  - **Status Beacon**: `ACTIVE` (Live pulsing beacon within 20m heartbeat), `IDLE` (Amber), and `DEACTIVATED` (Gray).
  - **View Switcher**: Switch between **Grid Cards View** and **Compact Table View** (high-density, ideal for mobile).
- 📱 **Mobile & 24/7 Remote Access**:
  - Server listens on all network interfaces (`0.0.0.0`).
  - Auto-detects your PC's local Wi-Fi IP (e.g. `http://192.168.1.85:3001`) with a copy button in the navbar.
  - Open on your iPhone or Android phone on the same Wi-Fi.
- ⚡ **Session Controls**:
  - **Deactivate / Activate**: Pause agent execution with one click to prevent token burn.
  - **Steer (Prompt Directives)**: Send manual instructions directly to agent sessions (`opencode run --session <id> "<message>"`).
  - **Live Inspector**: View tasks/todos, message transcripts, tool executions (bash commands, diffs), and model telemetry.

---

## 🚀 Quickstart

### 1. Launch the Dashboard
```bash
npm start
```
- **Desktop**: Open [http://localhost:3001](http://localhost:3001)
- **Mobile (on same Wi-Fi)**: Open `http://<your-lan-ip>:3001` (displayed on server launch and in the navbar)

### 2. Development Mode (Hot-Reloading)
```bash
npm run dev
```

---

## 🕒 Keeping it Active 24/7 on Your PC

To keep the fleet dashboard active in the background even if you close the terminal:

### With PM2:
```bash
npm install -g pm2
pm2 start server/index.js --name "agent-fleet"
pm2 save
```

### Remote Access Outside Home (Cellular / Outside Wi-Fi):
1. **Tailscale (Recommended)**: Install free Tailscale on your PC & phone. Access the dashboard from anywhere in the world securely.
2. **Cloudflare Tunnel**: Run `cloudflared tunnel --url http://localhost:3001` to get a free, private HTTPS link for remote access.

---

## 🌐 Roadmap: Cloud (Vercel) + Downloadable Desktop App

1. **Web App on Vercel**:
   - Host the dashboard on Vercel with user accounts (Sign In / Sign Up via Supabase Auth).
2. **Desktop Agent / Local Daemon**:
   - Downloadable desktop companion (built with Tauri / Electron) that pairs with your cloud account via a pairing token.
   - Syncs your local sessions from OpenCode, Cursor, and Claude Code to the cloud in real time so you can inspect and steer your PC's agents from anywhere!
