---
name: GOAT-PAY Theme System
description: How dark/light mode works in GOAT-PAY — CSS variables, toggle hook, and color patterns
---

## Rule
All theme colors use CSS variables set on `<html>` via `.dark` / `.light` classes. Use `useTheme()` hook from `@/contexts/ThemeContext` to access `theme` and `toggleTheme`.

**Why:** Instant swap without React re-renders; persisted to localStorage key `goatpay-theme`.

**How to apply:**
- In every component: `const { theme } = useTheme(); const isDark = theme === "dark";`
- Neon color pattern: `const neon = isDark ? "#00e676" : "#00a84f";`
- Text: `const textPrimary = isDark ? "#fff" : "#111"; const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";`
- Surface: `const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";`
- CSS utility classes: `gp-card`, `gp-btn`, `sidebar-item`, `sidebar-item-active`, `logo-glow`, `glow-text`, `page-watermark`
