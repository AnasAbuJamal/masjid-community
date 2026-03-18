# Theme Implementation Plan: Mocha & Cream Elegance

This document outlines the systematic approach to applying the luxurious, warm, and organic theme shown in the reference image to the `staff-web` application. This will serve as the master prompt and guide for styling.

## 1. Visual Identity & Aesthetic Goals
*   **Vibe:** Premium, calm, organic, and elegant.
*   **Key Elements:** Sweeping fluid gradients, high-contrast typography (Serif headings + Sans-serif body), floating card layouts with soft shadows, and a harmonious earthy palette.
*   **Shapes:** Generous border radii on cards (e.g., `rounded-3xl`), pill-shaped buttons (`rounded-full`), and overlapping asymmetrical grids.

## 2. Color Palette
The colors are rooted in coffee, earth, and cream tones. Since the project uses Tailwind CSS v4, these will be injected into the `@theme` block in `src/app/globals.css`.

*   **Backgrounds:** 
    *   `bg-cream`: `#F5F2EC` (Main app background - soft off-white/beige)
    *   `bg-card-light`: `#FFFFFF` (Solid white for bright cards)
*   **Accents & Gradients:**
    *   `mocha-dark`: `#4A2E1B` (Deep espresso/mocha for dark cards and primary text)
    *   `mocha`: `#7B4F35` (Mid-tone brown for gradients)
    *   `caramel`: `#A67653` (Lighter bronze/caramel for gradient transitions)
*   **Text:**
    *   `text-primary`: `#2B1A10` (Very dark brown, almost black, for high readability)
    *   `text-muted`: `#8C7364` (Soft brown for secondary text)

## 3. Typography
The design relies heavily on beautiful typography mixing classic and modern styles.
We will configure `next/font/google` in `src/app/layout.tsx`:

1.  **Headings (Serif):** `Playfair Display` or `Lora`. 
    *   *Usage:* Page titles, large card titles, decorative text.
    *   *Styling:* Tight tracking (letter-spacing), occasionally italicized for elegance.
2.  **Body Text (Sans-Serif):** `Inter` or `Outfit`.
    *   *Usage:* Paragraphs, buttons, small UI labels, metadata.
    *   *Styling:* Wide tracking for uppercase labels, highly legible.

## 4. UI Components & Styling Rules

### Surface & Cards
*   **Light Cards:** Solid white background (`bg-white`), large rounded corners (`rounded-[2rem]`), and soft, diffused spread shadows to create a floating effect (`shadow-[0_20px_40px_-15px_rgba(74,46,27,0.1)]`).
*   **Dark Cards:** Sweeping gradient backgrounds (e.g., `bg-gradient-to-br from-mocha-dark via-mocha to-caramel`), white text, and occasionally subtle inner glows or glassmorphic overlays.
*   **Images/Media:** Integrated with soft masks or seamlessly blending into the mocha gradients.

### Buttons & Inputs
*   **Primary Action:** Pill-shaped (`rounded-full`), outlined or solid depending on the card background. Typically white with dark text on dark cards, or dark border on light cards.
*   **Interactive Effects:** Smooth scaling on hover (`hover:scale-105`), gentle opacity transitions (`transition-all duration-300`).

### Spacing & Layout
*   Ample negative space (padding/margin) to let elements "breathe".
*   Overlapping layout: Cards slightly overlapping background gradient blobs to create depth.

---

## 5. Step-by-Step Implementation Prompt

To explicitly instruct an agent to build this, use the following execution steps:

### Step 1: Tailwind v4 Global Setup
Update `src/app/globals.css` to define the custom variables within the `@theme` block.
```css
@import "tailwindcss";

@theme {
  --color-mocha-900: #2B1A10;
  --color-mocha-800: #4A2E1B;
  --color-mocha-600: #7B4F35;
  --color-mocha-400: #A67653;
  --color-cream-100: #F5F2EC;
  --color-cream-50: #FAFAF8;

  --font-serif: "Playfair Display", serif;
  --font-sans: "Inter", sans-serif;

  --shadow-elegant: 0 20px 40px -15px rgba(74, 46, 27, 0.1);
  --shadow-elegant-dark: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
}

body {
  @apply bg-cream-100 text-mocha-900 font-sans antialiased selection:bg-mocha-400 selection:text-white;
}
```

### Step 2: Global Font Integration
Update `src/app/layout.tsx` to import and apply `Playfair_Display` and `Inter` via `next/font/google`. Apply the CSS variables `--font-serif` and `--font-sans` to the `<body>`.

### Step 3: Base UI Component Refactoring
If using Shadcn UI or custom components, rewrite the base variants:
*   **Card:** Add variants for `variant="cream"` (light, shadow) and `variant="mocha"` (dark gradient). Ensure `rounded-3xl` or `rounded-[2rem]` is standard.
*   **Button:** Update the `radius` to `full` (pill shape).

### Step 4: Background Gradients
Create a global layout component that renders the fluid, organic background gradients behind the main content wrapper. You can achieve this using absolute positioned `div`s with heavy blurred filters (`blur-[100px]`) colored with `--color-mocha-600` and `--color-cream-50`.

### Step 5: Iterative Page Updates
Go through each page (Dashboard, Login, Profiles) and replace hard borders and generic blue/gray colors with the new mocha-accented utility classes (`font-serif`, `shadow-elegant`, `bg-mocha-800`, etc.).
