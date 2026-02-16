# AI ScamShield Mobile (Android) — Expo React Native

This is the **mobile app folder** for AI ScamShield. It is **separate** from your existing web + backend project and won’t interfere with it.

## What works now
- Analyze **SMS / Email / URL** against your deployed FastAPI backend
- Displays **Risk Score**, **Risk Level**, **Reasons**, and **Recommended Actions**
- History and Trends screens (best-effort rendering from `/api/v1/stats` if available)

## Prerequisites
- Node.js 18+
- Expo CLI (runs via `npx expo`)
- (Optional) Android Studio emulator or a physical Android phone with **Expo Go**

## Configure backend URL
Copy `.env.example` to `.env` and set your backend:

```bash
EXPO_PUBLIC_API_URL=https://scamshield-backend-yb1y.onrender.com
```

## Run locally
```bash
npm install
npx expo start
```
- Press **a** to open Android emulator (if installed), or scan the QR with Expo Go.

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

> Note: EAS builds in the cloud and will output a downloadable APK link.
