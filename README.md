# AI ScamShield Mobile (Android) — Expo React Native

This is the **mobile app folder** for AI ScamShield. It is **separate** from your existing web + backend project and won’t interfere with it.

## What works now
- Analyze **SMS / Email / URL** against your deployed FastAPI backend
- Receive **shared text/links** from other apps (Messages, Gmail, WhatsApp, browser share menu) via Android Share Intent
- (Optional) **Clipboard URL prompt** when the app opens
- (Optional) **Gmail connect + “scan latest emails now”** (Google OAuth + Gmail readonly scope)
- Displays **Risk Score**, **Risk Level**, **Reasons**, and **Recommended Actions**
- History and Trends screens (best-effort rendering from `/api/v1/stats` if available)

## Important notes (Android)
- **Share Intent receiving requires a custom build (EAS APK / dev build).** It will **not** work inside stock Expo Go.
- Automatic reading of SMS is restricted on Android/Play Store. This app uses the **Share** flow (user shares an SMS/email/link into the app) to stay compliant.
- Gmail scanning requires the user to **sign in with Google** and grant the Gmail readonly scope.

## Prerequisites
- Node.js 18+
- Expo CLI (runs via `npx expo`)

## Configure backend URL
Copy `.env.example` to `.env` and set your backend:

```bash
EXPO_PUBLIC_API_URL=https://scamshield-backend-yb1y.onrender.com
```

## (Optional) Configure Gmail OAuth
Create OAuth Client IDs in Google Cloud Console (APIs & Services → Credentials):
- **Android client ID**: package name `com.jtecsolutions.scamshield` + add SHA-1 of your keystore
- **Web client ID**: used by some AuthSession flows

Then add to `.env`:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

## Run locally
```bash
npm install
# Align package versions to your Expo SDK
npx expo doctor --fix-dependencies

npx expo start
```

## Build an APK (EAS)
Install EAS CLI:
```bash
npm i -g eas-cli
eas login
```

Build APK (preview profile):
```bash
eas build -p android --profile preview
```

> EAS builds in the cloud and outputs a downloadable APK link.

## How to scan “incoming” SMS / emails / links
1. Open the message (Messages, Gmail, WhatsApp, etc.)
2. Tap **Share** → choose **AI ScamShield**
3. The app opens on **Analyze** with the content prefilled (and can auto-analyze if enabled)

For links, you can also **copy** and use **Paste** on the Analyze screen.
