# Store listing checklist (prep only)

This is a preparation checklist for App Store / Play Console. **Do not submit** until legal/privacy URLs and accounts are ready.

## Identifiers

| Platform | Value |
|----------|--------|
| iOS bundle ID | `com.splitshot.app` |
| Android applicationId | `com.splitshot.app` |
| Expo slug | `splitshot-mobile` |

Replace `extra.eas.projectId` in `apps/mobile/app.json` after running `eas init`.

## EAS Build (local commands)

From the monorepo root (or `apps/mobile`):

```bash
npm install -g eas-cli   # once
cd apps/mobile
eas login
eas init                 # creates real projectId
eas build --profile preview --platform ios
eas build --profile preview --platform android
eas build --profile production --platform all
```

Preview builds are for internal testing. Production builds feed TestFlight / Play internal testing — submission is a separate `eas submit` step (not automated here).

## Screenshots to capture

- Home: brand + upload CTA
- Editor: items assigned to people + totals bar
- History: owned splits grid
- Offline banner (optional)
- Sign in screen

Sizes: follow current [App Store](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications) and [Play Console](https://support.google.com/googleplay/android-developer/answer/9866151) specs for your target devices.

## Privacy & permissions copy

Already in `app.json`:

- Camera: photograph receipts
- Photo library: import receipt images
- Notifications: split paid / someone joined (Android `POST_NOTIFICATIONS`)

Add a public **Privacy Policy** URL and **Support** URL before store review.

## Age rating / content

- Utility / finance-lite (bill splitting)
- No user-generated public social feed
- Payments via Stripe Checkout (optional) — disclose in questionnaires

## Push credentials

- Expo Push works in Expo Go / EAS builds with projectId set
- For production iOS: Apple Push key in Expo credentials
- For production Android: FCM via Expo credentials

## TestFlight / Play internal testing

1. Build with `--profile production` (or preview for APK)
2. iOS: `eas submit -p ios` → TestFlight
3. Android: upload AAB/APK to internal testing track
4. Invite testers; verify login, upload, offline sync, push opt-in

## Pre-submit smoke tests

- [ ] Register / login
- [ ] Upload receipt (camera + library)
- [ ] Live edit with two devices
- [ ] Display currency
- [ ] Mark paid / copy owe
- [ ] Offline edit → reconnect flush
- [ ] History shows owned splits
