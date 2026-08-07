# @splitshot/mobile

Expo client for SplitShot (**SDK 54** — matches App Store Expo Go). Depends on `@splitshot/shared` and the web API.

```bash
# from monorepo root
nvm use
npm run dev:mobile

# or
cd apps/mobile && npx expo start -c
```

Scan the QR code with the App Store Expo Go app. Set `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WEB_URL` in `.env` for device testing.

## EAS

```bash
cd apps/mobile
eas build --profile preview --platform android
```

See [../../docs/STORE_CHECKLIST.md](../../docs/STORE_CHECKLIST.md).
