import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

const OUTBOX_DIR = path.join(process.cwd(), 'server', 'outbox');

// Ensure outbox folder exists for local development preview
if (!fs.existsSync(OUTBOX_DIR)) {
  try {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  } catch (e) {}
}

/**
 * Dispatches an email using the best available transport:
 * 1. Resend HTTP API (if RESEND_API_KEY is present)
 * 2. Nodemailer SMTP (if SMTP_HOST is present)
 * 3. Local Outbox & Console Logger (zero-configuration development fallback)
 */
export async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const defaultFrom = process.env.EMAIL_FROM || 'Agent Board <onboarding@agentboard.dev>';

  // 1. Resend HTTP API (Recommended)
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: defaultFrom,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || ''
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Resend API error: ${response.statusText}`);
      }

      console.log(`📧 [EMAIL SENT via Resend] ID: ${data.id} -> ${to} | Subject: "${subject}"`);
      return { success: true, provider: 'resend', id: data.id };
    } catch (err) {
      console.error(`⚠️ [Resend Send Failed, falling back to local logger]:`, err.message);
    }
  }

  // 2. Nodemailer SMTP (Gmail / Custom SMTP)
  if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: defaultFrom,
        to,
        subject,
        html,
        text
      });

      console.log(`📧 [EMAIL SENT via SMTP] MsgId: ${info.messageId} -> ${to} | Subject: "${subject}"`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`⚠️ [SMTP Send Failed, falling back to local logger]:`, err.message);
    }
  }

  // 3. Fallback: Local Outbox Preview (Zero-Setup Development Mode)
  const timestamp = Date.now();
  const safeEmail = String(to).replace(/[^a-zA-Z0-9@._-]/g, '_');
  const filename = `${timestamp}_${safeEmail}.html`;
  const previewPath = path.join(OUTBOX_DIR, filename);

  const previewDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin: 0; background-color: #05070B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }
    .meta-bar { background: #0E131F; border-bottom: 1px solid #1E293B; padding: 12px 24px; font-size: 13px; color: #94A3B8; }
    .meta-bar strong { color: #D4AF37; }
    .content-frame { max-width: 680px; margin: 30px auto; }
  </style>
</head>
<body>
  <div class="meta-bar">
    <div><strong>TO:</strong> ${escapeHtml(to)} | <strong>SUBJECT:</strong> ${escapeHtml(subject)}</div>
    <div><strong>TIME:</strong> ${new Date(timestamp).toLocaleString()} | <strong>OUTBOX PREVIEW</strong></div>
  </div>
  <div class="content-frame">
    ${html}
  </div>
</body>
</html>
  `;

  try {
    fs.writeFileSync(previewPath, previewDocument, 'utf8');
  } catch (e) {}

  console.log(`\n======================================================`);
  console.log(`📧 [LOCAL EMAIL DISPATCH - ZERO CONFIG PREVIEW]`);
  console.log(`🎯 Recipient: ${to}`);
  console.log(`📌 Subject:   ${subject}`);
  console.log(`📂 Outbox:    ${previewPath}`);
  console.log(`💡 Note: Configure RESEND_API_KEY or SMTP credentials in .env to send real-world emails.`);
  console.log(`======================================================\n`);

  return { success: true, provider: 'outbox', previewPath };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Builds and sends the comprehensive Welcome Email with Developer Guide & Onboarding Walkthrough
 */
export async function sendWelcomeEmail({ email, displayName }) {
  const name = displayName?.trim() || email.split('@')[0];
  const subject = `Welcome to Agent Board — Your Autonomous AI Orchestration Cockpit`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #07090E;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 640px;
      margin: 0 auto;
      background-color: #0A0E17;
      border: 1px solid #1E293B;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 30px;
      margin-bottom: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(180deg, #121826 0%, #0A0E17 100%);
      padding: 36px 32px 24px;
      border-bottom: 1px solid #1E293B;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 9999px;
      color: #F1D467;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
    }
    .brand-title span {
      color: #D4AF37;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      margin: 0;
    }
    .content {
      padding: 36px 32px;
    }
    h2 {
      font-size: 20px;
      color: #FFFFFF;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 16px;
      color: #F1D467;
      font-weight: 600;
      margin-top: 28px;
      margin-bottom: 10px;
    }
    p {
      color: #94A3B8;
      font-size: 14px;
      margin: 0 0 16px;
    }
    .greeting {
      font-size: 17px;
      color: #F8FAFC;
      margin-bottom: 20px;
    }
    .feature-card {
      background: #0F1422;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 14px;
    }
    .feature-header {
      font-weight: 700;
      font-size: 14px;
      color: #F1D467;
      margin-bottom: 4px;
    }
    .feature-desc {
      font-size: 13px;
      color: #94A3B8;
      margin: 0;
    }
    .step-box {
      display: flex;
      align-items: flex-start;
      margin-bottom: 14px;
      background: #0D121F;
      border-left: 3px solid #D4AF37;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }
    .step-num {
      font-weight: 800;
      color: #D4AF37;
      font-size: 14px;
      margin-right: 12px;
      white-space: nowrap;
    }
    .step-content {
      font-size: 13px;
      color: #CBD5E1;
    }
    .step-content strong {
      color: #FFFFFF;
    }
    .cta-container {
      text-align: center;
      margin-top: 32px;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%);
      color: #07090E !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35);
      letter-spacing: 0.02em;
    }
    .security-notice {
      background: rgba(30, 41, 59, 0.4);
      border: 1px dashed #334155;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #64748B;
      margin-top: 28px;
    }
    .footer {
      border-top: 1px solid #1E293B;
      padding: 24px 32px;
      text-align: center;
      background: #080B12;
      font-size: 12px;
      color: #64748B;
    }
    .footer a {
      color: #D4AF37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">Universal AI Agent Cockpit</div>
      <h1 class="brand-title">Agent <span>Board</span></h1>
      <p class="subtitle">Mission Control for Autonomous AI Coding Agents</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hello <strong>${escapeHtml(name)}</strong>, welcome to the Agent Board cockpit! 🚀
      </div>

      <p>
        Your account has been successfully initialized. You now have access to the premier command center engineered specifically for multi-agent workflows across modern development environments.
      </p>

      <h2>What is Agent Board?</h2>
      <p>
        Agent Board is a real-time, hardware-integrated command center that bridges, monitors, and steers autonomous coding agents like <strong>OpenCode</strong>, <strong>Cursor</strong>, <strong>Windsurf</strong>, <strong>Claude Code</strong>, and <strong>Antigravity</strong>.
      </p>

      <h3>How Agent Board Supercharges Your Projects</h3>

      <div class="feature-card">
        <div class="feature-header">⚡ Multi-Agent Fleet Orchestration</div>
        <div class="feature-desc">Monitor dozens of parallel agent processes across distinct repositories and workspaces from a unified glass cockpit.</div>
      </div>

      <div class="feature-card">
        <div class="feature-header">🎯 Real-Time Prompt Steering</div>
        <div class="feature-desc">Inject guidance, constraints, or new directions into live agent loops without aborting your build sessions or losing terminal history.</div>
      </div>

      <div class="feature-card">
        <div class="feature-header">🔄 Dynamic Model Re-Allocation</div>
        <div class="feature-desc">Seamlessly switch models between Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, and Gemini 2.0 Flash on the fly based on reasoning complexity.</div>
      </div>

      <div class="feature-card">
        <div class="feature-header">🔒 Zero-Cloud Local Privacy</div>
        <div class="feature-desc">Your code, prompts, and credentials never touch third-party servers. All telemetry is stored in local, ultra-fast SQLite WAL databases right on your machine.</div>
      </div>

      <h3>Step-by-Step Guide: How to Get Started</h3>

      <div class="step-box">
        <div class="step-num">Step 1</div>
        <div class="step-content"><strong>Download Desktop Cockpit:</strong> Agent Board requires the native desktop client for direct file-system inspection and IPC telemetry.</div>
      </div>

      <div class="step-box">
        <div class="step-num">Step 2</div>
        <div class="step-content"><strong>Sign In:</strong> Launch the desktop application and sign in with this registered email (<code>${escapeHtml(email)}</code>) or through Google OAuth.</div>
      </div>

      <div class="step-box">
        <div class="step-num">Step 3</div>
        <div class="step-content"><strong>Auto-Discover Agents:</strong> Start your favorite AI coding tool (OpenCode, Cursor, or CLI). Agent Board automatically detects active sessions and displays live telemetry.</div>
      </div>

      <div class="step-box">
        <div class="step-num">Step 4</div>
        <div class="step-content"><strong>Steer & Deploy:</strong> Switch between <em>Plan</em> and <em>Build</em> modes, monitor token burn rates, and allocate models across your fleet in real-time.</div>
      </div>

      <div class="cta-container">
        <a href="http://localhost:3001" class="cta-button">Open Agent Board Cockpit &rarr;</a>
      </div>

      <div class="security-notice">
        <strong>Security Tip:</strong> You can manage your account, update your credentials, or request a secure OTP password reset at any time from the cockpit or profile settings.
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Agent Board. Universal AI Agent Command Center.</p>
      <p>
        <a href="https://github.com/KaranDarade/Agent-Board">GitHub Repository</a> &bull;
        <a href="http://localhost:3001">Web Showcase</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Agent Board, ${name}!

Your universal command center for autonomous AI coding agents (OpenCode, Cursor, Windsurf, Claude Code, Antigravity) is ready.

Why Agent Board is essential for your development:
- Multi-Agent Fleet Orchestration: Monitor parallel agent processes across distinct repositories.
- Real-Time Prompt Steering: Course-correct running agent loops without aborting sessions.
- Dynamic Model Re-Allocation: Switch between Claude 3.5 Sonnet, GPT-4o, DeepSeek, and Gemini.
- Zero-Cloud Local Privacy: All telemetry runs locally on your machine via SQLite WAL.

How to get started:
1. Download the Desktop Cockpit.
2. Sign in with your registered email: ${email}
3. Start your AI agent tool; Agent Board auto-discovers active sessions.
4. Steer, monitor, and deploy!

Open your cockpit: http://localhost:3001
GitHub Repo: https://github.com/KaranDarade/Agent-Board
  `;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Builds and sends the luxury 6-digit OTP Password Reset Email
 */
export async function sendPasswordResetEmail({ email, otpCode }) {
  const subject = `Your Agent Board Password Reset Code: ${otpCode}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #07090E;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #E2E8F0;
      line-height: 1.6;
    }
    .wrapper {
      max-width: 560px;
      margin: 30px auto;
      background-color: #0A0E17;
      border: 1px solid #1E293B;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(180deg, #121826 0%, #0A0E17 100%);
      padding: 32px 28px 20px;
      border-bottom: 1px solid #1E293B;
      text-align: center;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
    }
    .brand-title span {
      color: #D4AF37;
    }
    .content {
      padding: 32px 28px;
      text-align: center;
    }
    h2 {
      font-size: 18px;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 12px;
    }
    p {
      color: #94A3B8;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .otp-card {
      background: #0E131F;
      border: 2px solid #D4AF37;
      border-radius: 12px;
      padding: 24px 16px;
      margin: 20px auto;
      max-width: 340px;
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #F1D467;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #FFFFFF;
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
    }
    .timer-note {
      font-size: 12px;
      color: #E2E8F0;
      margin-top: 8px;
    }
    .warning {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #FCA5A5;
      text-align: left;
      margin-top: 24px;
    }
    .footer {
      border-top: 1px solid #1E293B;
      padding: 20px;
      text-align: center;
      background: #080B12;
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-title">Agent <span>Board</span></div>
    </div>
    <div class="content">
      <h2>Password Reset Verification</h2>
      <p>A request was received to reset the password for your Agent Board account (<strong>${escapeHtml(email)}</strong>). Use the one-time code below to verify your identity:</p>

      <div class="otp-card">
        <div class="otp-label">One-Time Security Code</div>
        <div class="otp-code">${escapeHtml(otpCode)}</div>
        <div class="timer-note">⏰ Valid for 10 minutes</div>
      </div>

      <div class="warning">
        <strong>Security Notice:</strong> Never share this code with anyone. Agent Board support will never ask for your verification code. If you did not make this request, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Agent Board &bull; Secure Local-First Telemetry
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Agent Board Password Reset Code: ${otpCode}

Your one-time verification code is: ${otpCode}
Valid for 10 minutes.

If you did not request this password reset, please ignore this email.
  `;

  return sendEmail({ to: email, subject, html, text });
}
