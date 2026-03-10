# Capacitor Execution Checklist

## Phase 1
- Install Capacitor CLI and native platform packages.
- Add `capacitor.config.ts`.
- Generate `android/` and `ios/` projects.
- Add sync/open/build-native scripts.

Validation
- `npm run lint`
- `npm run build`
- `npm run cap:sync`
- `npx cap ls`

## Phase 2
- Hydrate local storage from native `Preferences` at startup.
- Mirror storage writes/removes to native `Preferences`.
- Flush storage to native on app background transition.
- Replace direct `localStorage` calls with `SafeStorage` for settings/localization/customize/lab state.

Validation
- `npm run lint`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`

## Phase 3
- Harden native media save logic with album caching and retries.
- Add native batch save module with completion/failure reporting.

Validation
- `npm run lint`
- `npm run build`

## Phase 4
- Wire native export flows to batch save path.
- Add loading progress state and UI percentage during long exports.
- Ensure loading state resets with `try/finally`.

Validation
- `npm run lint`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build:native`

## Phase 5
- Set Android target/compile SDK to API 35.
- Add Android media permissions for photo workflows.
- Add iOS photo usage descriptions.
- Add iOS privacy manifest template file.

Validation
- `cd android && ./gradlew tasks --all`
- `npm run cap:sync`

## Phase 6
- Add repeatable final-check scripts.
- Run dependency version check.
- Run production dependency audit.

Validation
- `npm run check:deps`
- `npm run check:security`
- `npm run check:final`
