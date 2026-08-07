# @splitshot/mobile

Expo client for SplitShot. Depends on `@splitshot/shared` and the web API.

```bash
# from monorepo root
npm run dev:mobile

# or
cd apps/mobile && npx expo start
```

Set `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WEB_URL` in `.env` for device testing.

## EAS

```bash
cd apps/mobile
eas build --profile preview --platform android
```

See [../../docs/STORE_CHECKLIST.md](../../docs/STORE_CHECKLIST.md).
