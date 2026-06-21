# SSB Prep Tracker — Standalone App

This is a installable web app (PWA). Once deployed and added to your
home screen, it opens full-screen like a native app, works offline, and
saves your checklist progress on your phone.

## Files in this folder

- `index.html` — entry point
- `app.jsx` — the app (compiles in-browser, no build step needed)
- `data.js` — your full 30-day tracker content
- `styles.css` — the visual design
- `manifest.json` — tells the phone this is an installable app
- `sw.js` — service worker, makes it work offline
- `icons/` — app icons

You do **not** need Node, npm, or any build tool. These are static files —
upload them as-is.

---

## Deploy with GitHub Pages (free, ~10 minutes)

### 1. Create a GitHub account (skip if you have one)
Go to github.com and sign up.

### 2. Create a new repository
- Click the **+** in the top right → **New repository**
- Name it something like `ssb-tracker`
- Set it to **Public** (required for free GitHub Pages)
- Don't add a README — leave it empty
- Click **Create repository**

### 3. Upload the files
- On the new repo page, click **uploading an existing file**
- Drag in all the files from this folder (keep the `icons` folder structure —
  upload the icons folder by dragging it in as a folder, or create an
  `icons` folder in the GitHub web UI first and upload the 4 PNGs into it)
- Commit the files (the green button at the bottom)

### 4. Turn on GitHub Pages
- Go to the repo's **Settings** tab
- Click **Pages** in the left sidebar
- Under "Build and deployment" → **Source**, choose **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Click **Save**
- Wait ~1 minute, refresh the page — you'll see a link like:
  `https://yourusername.github.io/ssb-tracker/`

### 5. Install it on your phone
- Open that link on your phone in **Chrome** (Android) or **Safari** (iPhone)
- **Android (Chrome):** tap the **⋮** menu → **Add to Home screen** (or wait
  for the in-app "Install" banner)
- **iPhone (Safari):** tap the **Share** icon (square with arrow) →
  **Add to Home Screen**
- It now sits on your home screen with its own icon, opens full-screen,
  no browser bar, and works without internet after the first load.

---

## Updating the tracker later

If you ever want to tick off tasks differently, fix a typo, or change a date:
edit the relevant file (mostly `data.js`) and re-upload it to the same GitHub
repo (drag the new version in — GitHub will ask to replace it). GitHub Pages
updates automatically within a minute or two. No re-installation needed on
your phone — it'll pick up the new version next time you open it (you may
need to fully close and reopen the app once for the service worker to fetch
the update).

## Your data stays on your device

Checklist progress and self-ratings are stored in your phone's local browser
storage, not on any server. They won't sync across devices, and clearing
your browser's site data for this app would reset progress. If you want
cross-device sync or cloud backup later, that's a bigger step up (needs a
real backend) — let me know if you want to go there.
