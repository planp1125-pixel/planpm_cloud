# Project Structure

```
.
├─ docs/
│  ├─ PROJECT_SUMMARY.md
│  └─ PROJECT_STRUCTURE.md (this file)
├─ src/
│  ├─ ai/
│  │  ├─ genkit.ts
│  │  └─ flows/
│  │     └─ predictive-maintenance-advisor.ts
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ page.tsx (Dashboard)
│  │  ├─ actions.ts (server actions, AI call)
│  │  ├─ actions/log.ts
│  │  ├─ advisor/page.tsx
│  │  ├─ instruments/page.tsx
│  │  ├─ results/page.tsx
│  │  ├─ design-results/page.tsx
│  │  └─ (auth)/
│  │     ├─ layout.tsx
│  │     ├─ login/page.tsx
│  │     ├─ signup/page.tsx
│  │     └─ auth/callback/route.ts
│  ├─ components/
│  │  ├─ SupabaseProvider.tsx
│  │  ├─ FirebaseErrorListener.tsx
│  │  ├─ theme-provider.tsx, theme-toggle.tsx
│  │  ├─ layout/ (sidebar, header, main layout, app-content)
│  │  ├─ advisor/ (advisor-form)
│  │  ├─ dashboard/ (overview cards, charts, upcoming list)
│  │  ├─ instruments/ (table, dialogs, columns)
│  │  ├─ maintenance/ (update/view dialogs)
│  │  └─ ui/ (shadcn-style primitives: button, card, table, sidebar, etc.)
│  ├─ contexts/
│  │  └─ auth-context.tsx
│  ├─ firebase/
│  │  ├─ config.ts, index.ts
│  │  ├─ client/provider helpers (client-provider, provider, non-blocking-*),
│  │  ├─ firestore hooks (use-doc, use-collection),
│  │  └─ error handling (errors, error-emitter)
│  ├─ hooks/
│  │  ├─ use-toast.ts
│  │  ├─ use-mobile.tsx
│  │  ├─ use-instrument-types.ts
│  │  └─ use-maintenance-types.ts
│  └─ lib/
│     ├─ supabase.ts
│     ├─ types.ts
│     ├─ utils.ts
│     ├─ data.ts
│     └─ placeholder-images.(ts|json)
├─ public/ (not listed if empty)
├─ config files: package.json, tsconfig.json, tailwind.config.ts, next.config.ts, postcss.config.mjs
└─ firebase rules/config: firestore.rules, apphosting.yaml
```

Use this map alongside `docs/PROJECT_SUMMARY.md` for orientation.
