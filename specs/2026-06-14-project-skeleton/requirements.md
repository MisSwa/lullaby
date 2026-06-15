# Phase 0 — Project Skeleton: Requirements

## Scope

This phase produces a runnable Expo app with zero product features. Its only purpose is to establish a correct, clean foundation that all subsequent phases build on without needing to revisit foundational decisions.

No user-visible UI is shipped in this phase. The app renders a blank safe area view.

---

## Expo SDK Version

**Pin to the latest stable Expo SDK at the time of `npx create-expo-app` execution.** Expo SDK 52 is the minimum acceptable version. Record the exact pinned version in a comment at the top of `package.json` or in a `VERSION_NOTES.md` at the project root.

Do not upgrade the SDK mid-phase. All packages installed via `npx expo install` will be resolved to SDK-compatible versions automatically.

---

## TypeScript Configuration

`tsconfig.json` must contain exactly:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@theme/*": ["src/theme/*"],
      "@types/*": ["src/types/*"],
      "@services/*": ["src/services/*"],
      "@context/*": ["src/context/*"],
      "@hooks/*": ["src/hooks/*"],
      "@screens/*": ["src/screens/*"],
      "@modals/*": ["src/modals/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

**`strict: true` is non-negotiable.** `noUnusedLocals` and `noUnusedParameters` are set to `true` to prevent dead code accumulating across phases.

The `paths` aliases must be configured in `babel.config.js` as well via `babel-plugin-module-resolver` (install as a dev dependency).

---

## ESLint Configuration

`.eslintrc.js`:

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',          // Not needed with React 17+
    'react-hooks/exhaustive-deps': 'error',      // Downgraded to error, not warn
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['error', 'warn'] }], // Allow console.error and .warn only
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

---

## Prettier Configuration

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

---

## Folder Structure Contract

The skeleton must produce exactly this directory tree. Every directory must exist. Directories with no files yet contain a `.gitkeep`.

```
lullaby/
├── App.tsx
├── app.json
├── babel.config.js
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .eslintignore
├── package.json
├── CLAUDE.md
├── specs/
│   ├── mission.md
│   ├── tech-stack.md
│   ├── roadmap.md
│   └── 2026-06-14-project-skeleton/
│       ├── plan.md
│       ├── requirements.md
│       └── validation.md
└── src/
    ├── theme/
    │   └── colors.ts
    ├── types/
    │   ├── tracker.ts
    │   └── baby.ts
    ├── services/
    │   └── db.ts
    ├── context/
    │   ├── TrackerContext.tsx
    │   └── SettingsContext.tsx
    ├── hooks/
    │   └── .gitkeep
    ├── screens/
    │   └── .gitkeep
    └── modals/
        └── .gitkeep
```

No files outside this tree may be created in this phase. `screens/` and `modals/` are intentionally empty — they are filled in Phase 1 and beyond.

---

## SQLite Schema

`initializeDatabase` must execute the following SQL in order:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  dob INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS baby_logs (
  id TEXT PRIMARY KEY NOT NULL,
  baby_id TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  notes TEXT,
  endTime INTEGER,
  feedType TEXT,
  leftDuration INTEGER,
  rightDuration INTEGER,
  amountMl INTEGER,
  status TEXT,
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_baby_timestamp ON baby_logs (baby_id, timestamp DESC);
```

---

## Context Scaffold Contracts

### TrackerContext

Must expose (with no-op or stub implementations in Phase 0):

```ts
interface TrackerContextType {
  babies: Baby[];
  activeBabyId: string | null;
  setActiveBabyId: (id: string) => void;
  logs: BabyLog[];
  active: ActiveTrackers;
  refreshLogs: () => Promise<void>;
  // All action stubs — implemented in later phases:
  startSleep: () => void;
  stopSleep: (notes?: string) => Promise<void>;
  toggleBreastFeed: (side: 'left' | 'right') => void;
  saveBreastFeed: (notes?: string) => Promise<void>;
  logBottle: (amountMl: number, notes?: string) => Promise<void>;
  logSolids: (notes?: string) => Promise<void>;
  logDiaper: (status: 'wet' | 'dirty' | 'mixed' | 'dry', notes?: string) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  createBaby: (name: string, dob: number) => Promise<void>;
}
```

### SettingsContext

Must expose (with hardcoded defaults in Phase 0):

```ts
interface SettingsContextType {
  feedReminderEnabled: boolean;
  feedReminderMinutes: number;      // default: 180 (3 hours)
  diaperReminderEnabled: boolean;
  diaperReminderMinutes: number;    // default: 240 (4 hours)
  updateSettings: (patch: Partial<Omit<SettingsContextType, 'updateSettings'>>) => void;
}
```

---

## Constraints from CLAUDE.md & tech-stack.md

- All IDs in `db.ts` stubs must use `expo-crypto` (`Crypto.randomUUID()`). `Math.random()` is banned.
- No `any` type anywhere. All stub functions have explicit return types.
- No navigation library installed.
- No state management library installed.
- `expo-sqlite` is the only persistence mechanism.
- `console.log` is only permitted in `initializeDatabase` (the init confirmation message). All other `console.*` calls use `console.error` or `console.warn`.

---

## Out of Scope

- Any visible UI beyond a blank `SafeAreaView`
- Onboarding modal (Phase 1)
- Any tracking feature
- Notification setup
- Backup logic
