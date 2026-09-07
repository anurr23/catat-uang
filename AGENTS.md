# Expo SDK 57 Project

- **SDK Docs**: Exact versioned docs at https://docs.expo.dev/versions/v57.0.0/
- **Entrypoint**: `index.ts` -> `App.tsx`

## App Architecture
- Single-page flow state in `App.tsx` (`login` -> `dashboard` | `history` | `report`)
- Liquid Glass UI theme with `expo-blur`, `expo-linear-gradient`, `expo-haptics`
- Core features: Auth demo, live balance calculation, category breakdown report, daily & monthly history filters, animated glass toast & loaders.

## Commands
- Dev: `npx expo start` (or `npm run start`)
- Typecheck: `npx tsc --noEmit`

## Environment & Dependencies
- React 19 / React Native 0.86 / Expo SDK 57
- No `@types/node` installed; avoid referencing `NodeJS.*` globals in code. Use `ReturnType<typeof setTimeout>` for timer references.
