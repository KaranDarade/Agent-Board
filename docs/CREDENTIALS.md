# Agent Board — Credential & API Configuration Guide

This guide provides clear, step-by-step instructions on how to obtain and configure your Google OAuth credentials, transactional email keys (for the Welcome Email & Forgot Password OTP), and desktop auto-update releases.

---

## 1. Google OAuth 2.0 Credentials (Free — 3 Minutes)

Agent Board uses authentic Google OAuth 2.0 authorization servers. Follow these steps to generate your Client ID and Client Secret:

1. **Open Google Cloud Console**:
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. **Create or Select a Project**:
   - Click the project selector dropdown in the top navigation bar.
   - Click **"New Project"**.
   - Name your project: **Agent Board** (or your preferred name) -> Click **Create**.
3. **Configure the OAuth Consent Screen**:
   - In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
   - Select User Type: **External** -> Click **Create**.
   - Fill in the required fields:
     - **App name**: `Agent Board`
     - **User support email**: *Select your Google email address*
     - **Developer contact information**: *Enter your Google email address*
   - Click **Save and Continue**.
   - Under **Scopes**, click **Add or Remove Scopes**, check the following 3 scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Update** -> Click **Save and Continue** -> Click **Save and Continue** (skip test users).
4. **Create OAuth 2.0 Client Credentials**:
   - In the left sidebar, navigate to **APIs & Services** > **Credentials**.
   - Click **+ CREATE CREDENTIALS** at the top -> Select **OAuth client ID**.
   - **Application type**: Select **Web application**.
   - **Name**: `Agent Board Web & Desktop`
   - **Authorized JavaScript origins**:
     - `http://localhost:3001`
     - `http://localhost:5173`
     - *(Add your custom production domain if deployed on Vercel/Render)*
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/google/callback`
     - *(Add `https://your-domain.com/api/auth/google/callback` if deployed)*
   - Click **Create**.
5. **Copy Your Credentials to `.env`**:
   - A modal will show your **Client ID** and **Client Secret**.
   - Add them to the `.env` file in the project root:
     ```env
     GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
     ```
6. **Done!**
   - Click "Continue with Google" in the Web Showcase or Desktop Cockpit. Authentication will connect seamlessly.

---

## 2. Transactional Email Setup (Welcome Email & Forgot Password OTP)

Agent Board includes an email engine that automatically chooses the best available provider. Choose **Option A (Resend)** or **Option B (Gmail SMTP)**:

### Option A: Resend API (Recommended — Fastest Setup)
*Resend provides 3,000 free transactional emails every month with zero server configuration.*

1. **Sign Up**:
   - Go to [https://resend.com/](https://resend.com/) and create a free account.
2. **Create API Key**:
   - In your Resend dashboard, click **API Keys** in the sidebar.
   - Click **Create API Key**.
   - Name: `Agent Board Production` (Permission: *Full Access*).
   - Click **Add**.
3. **Copy to `.env`**:
   - Add your key (starts with `re_...`) to `.env`:
     ```env
     RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
     EMAIL_FROM="Agent Board <onboarding@resend.dev>"
     ```
   *(Note: `onboarding@resend.dev` is Resend's free testing sender, allowing you to send emails directly to your signup email immediately without configuring custom DNS domains!)*

---

### Option B: Gmail SMTP with App Password (Free)
*If you prefer using your existing Gmail or Google Workspace account:*

1. **Enable 2-Step Verification**:
   - Open your [Google Account Security Settings](https://myaccount.google.com/security).
   - Ensure **2-Step Verification** is turned ON.
2. **Generate an App Password**:
   - In Google Account search, type **"App passwords"** or visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   - App name: `Agent Board` -> Click **Create**.
   - Google will show a 16-character code (e.g., `abcd efgh ijkl mnop`).
3. **Add to `.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM="Agent Board <your_email@gmail.com>"
   ```

---

### Option C: Zero-Configuration Local Development (Built-In)
If neither `RESEND_API_KEY` nor `SMTP_HOST` is configured in `.env`:
- Agent Board automatically falls back to the **Local Outbox Engine**.
- Every welcome email and password reset OTP is saved to:
  `server/outbox/<timestamp>_<email>.html`
- A notification with the OTP code is printed directly in the terminal console.
- Signups, logins, and password resets **never fail, hang, or crash**.

---

## 3. Desktop Auto-Updater (GitHub Releases)

The native Desktop cockpit (`electron-updater`) automatically checks for new releases:
1. **GitHub Repository**:
   - The repository is connected to: `https://github.com/KaranDarade/Agent-Board.git`.
2. **Publishing a Release**:
   - When you increment the `"version"` in `package.json` (e.g. `1.0.1`), build with:
     ```bash
     npm run dist
     ```
   - Publish the resulting `.exe` and `latest.yml` to GitHub Releases.
3. **Automatic Detection**:
   - When users click **"Check for Updates"** in the Desktop cockpit, Agent Board checks GitHub releases, downloads the new version in the background, displays a live progress bar, and prompts them to **"Restart & Apply Update"**.
   - You can also click **"Simulate Update Cycle"** in the update manager to test the download progress and restart flow locally at any time.
