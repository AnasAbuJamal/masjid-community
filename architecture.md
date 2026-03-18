# Masjid Phone App - Architecture Documentation

## Project Overview

This repository contains a **multi-project monorepo** for a Masjid (mosque) management platform with three applications:

1. **Staff Web Portal** (`staff-web/`) - Next.js web application for staff management
2. **Mobile App** (`masjid-mobile/`) - Expo/React Native mobile application
3. **Legacy Web** (`src/`) - Unused Vite + React project (to be removed)

---

## File-by-File Explanation

### Root Level Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root package.json (primarily for the Vite project in `src/`) |
| `vite.config.ts` | Vite configuration for the unused web app |
| `tsconfig.json` | TypeScript config for the Vite project |
| `tsconfig.node.json` | TypeScript config for Node.js (Vite config) |
| `index.html` | HTML entry point for the Vite app |
| `tailwind.config.cjs` | Tailwind CSS configuration |
| `postcss.config.cjs` | PostCSS configuration |
| `components.json` | Shadcn/ui components configuration |
| `README.md` | Project documentation |
| `plan.md` | Project planning document |

### `src/` Directory (Unused Vite Project)

| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point (renders empty App) |
| `src/App.tsx` | **EMPTY** - Just returns `<div></div>` |
| `src/main.ts` | Vanilla JS entry point (unused, for vanilla Vite) |
| `src/counter.ts` | Counter example (unused, leftover from Vite template) |
| `src/style.css` | Styles for vanilla JS example (unused) |
| `src/index.css` | Tailwind CSS imports |
| `src/App.css` | Unused CSS file |
| `src/typescript.svg` | Unused asset |
| `src/lib/utils.ts` | Utility functions (cn helper) |
| `src/hooks/use-toast.ts` | Toast hook (unused) |
| `src/hooks/use-mobile.tsx` | Mobile detection hook (unused) |

### `src/components/ui/` - Shadcn/UI Component Library

**All 55 UI components are unused** - they were installed but never utilized in the empty App.tsx:

- `accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`
- `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`
- `breadcrumb.tsx`, `button-group.tsx`, `button.tsx`
- `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`
- `checkbox.tsx`, `collapsible.tsx`, `command.tsx`
- `context-menu.tsx`, `dialog.tsx`, `drawer.tsx`
- `dropdown-menu.tsx`, `empty.tsx`
- `field.tsx`, `form.tsx`
- `hover-card.tsx`
- `input-group.tsx`, `input-otp.tsx`, `input.tsx`, `item.tsx`
- `kbd.tsx`
- `label.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`, `popover.tsx`, `progress.tsx`
- `radio-group.tsx`, `resizable.tsx`
- `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `spinner.tsx`, `switch.tsx`
- `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`

### `public/` Directory

| File | Purpose |
|------|---------|
| `vite.svg` | Vite logo (unused) |
| `favicon.svg` | Favicon |
| `_redirects` | Netlify redirects configuration |

---

## Unnecessary Files

### 🚨 Files That Can Be Deleted

| Path | Reason |
|------|--------|
| `src/*` (entire directory) | **Empty Vite project** - App.tsx returns only `<div></div>`. All UI components and code are unused. |
| `src/components/ui/*` | 55 shadcn/ui components installed but never used |
| `src/hooks/*` | Hooks created but never imported anywhere |
| `src/lib/utils.ts` | Only has `cn()` helper that's not used |
| `src/main.ts` | Vanilla JS entry point, completely unused |
| `src/counter.ts` | Vite template example code, unused |
| `src/style.css` | Vanilla Vite example styles, unused |
| `src/App.css` | Empty CSS file |
| `src/typescript.svg` | Unused asset |
| `src/typescript.svg` | Unused asset |
| `public/vite.svg` | Unused asset |
| `package.json` | Should be removed since the Vite app is abandoned |
| `vite.config.ts` | Vite config for unused project |
| `tsconfig.json` | TypeScript config for unused Vite project |
| `tsconfig.node.json` | TypeScript Node config for Vite |
| `tailwind.config.cjs` | Tailwind config for Vite project |
| `postcss.config.cjs` | PostCSS config for Vite project |
| `index.html` | Entry point for abandoned Vite app |
| `.gitignore` | Should be consolidated at root |
| `plan.md` | Old planning document |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Repository Root                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   staff-web/        │    │      masjid-mobile/             │ │
│  │   (Next.js 16)      │    │      (Expo + React Native)      │ │
│  │                     │    │                                 │ │
│  │   - Staff Portal    │    │   - Prayer Times               │ │
│  │   - Dashboard       │    │   - Donations                  │ │
│  │   - Management      │    │   - Events                      │ │
│  │   - Auth (NextAuth) │    │   - Workers                     │ │
│  │   - Stripe Payments │    │                                 │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    src/ (ABANDONED)                         ││
│  │   Vite + React project - EMPTY, all code unused            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Staff Web (`staff-web/`)
- **Framework**: Next.js 16.1.6
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Beta)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui components
- **Payments**: Stripe
- **State Management**: React Hook Form + Zod validation
- **Charts**: Recharts

#### Mobile App (`masjid-mobile/`)
- **Framework**: Expo SDK 54 + React Native 0.81.5
- **Navigation**: Expo Router v6
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Storage**: AsyncStorage
- **Animations**: React Native Reanimated

---

## Recommendations

### Immediate Actions
1. **Delete the entire `src/` directory** - It's an abandoned Vite project
2. **Remove root configuration files** - `package.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.cjs`, `postcss.config.cjs`, `index.html`
3. **Keep only**:
   - `masjid-mobile/` directory
   - `staff-web/` directory
   - Root `.gitignore`
   - Any shared configuration at root level

### After Cleanup, Repository Structure
```
masjid-phone-app/
├── .gitignore
├── README.md
├── staff-web/           # Next.js staff portal
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── ...
└── masjid-mobile/       # Expo mobile app
    ├── app/
    ├── components/
    ├── services/
    ├── stores/
    ├── package.json
    └── ...
```

---

## Summary

- **Active Projects**: 2 (`staff-web`, `masjid-mobile`)
- **Abandoned Project**: 1 (`src/` - Vite app)
- **Unused UI Components**: 55+ shadcn/ui components
- **Action Required**: Delete `src/` and root config files for the abandoned Vite project
