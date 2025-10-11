# bombay – Brand Guide (LLM-friendly)

## Brand Identity

- **Name**: Always use lowercase "bombay" (never Bombay, BOMBAY, or mixed case)
- **Vibe**: minimal, technical, playful
- **Primary font**: IBM Plex Mono (weight 600 for headings, 400–500 for body text)
- **Primary action color**: brand-500 (#FF2E88). Hover → lighten to brand-300
- **Surfaces**: use `bg` for page background, `panel` for cards; borders use `border`
- **Icon motif**: tiny **▎** (code caret bar) or **⌘** accent — no illustration needed

## Color Palette

### Dark Theme (Default)
- **Background**: #0B1220 (deep navy)
- **Text**: #F8FAFC (near white)
- **Panel**: #0F172A (slightly lighter navy)
- **Border**: #1F2937 (muted gray)

### Brand Colors (Same for both themes)
- **brand-600**: #E11D74 (deep fuchsia)
- **brand-500**: #FF2E88 (hot pink) — primary
- **brand-300**: #FFA6D1 (light pink)
- **brand-100**: #FFE4F0 (very light pink)

### Light Theme
- **Background**: #FFF7FB (warm white with pink tint)
- **Text**: #0B1220 (dark navy)
- **Panel**: #FFFFFF (pure white)
- **Border**: #E2E8F0 (light gray)

## Typography

- **Primary font**: IBM Plex Mono (loaded via Google Fonts)
- **Font weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Font stack**: `IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`
- **Do not introduce non-mono fonts** — maintain the technical aesthetic

## Component Recipes (Tailwind Classes)

### Primary Button
```
inline-flex items-center gap-2 rounded-xl px-4 py-2
text-white bg-[var(--color-brand-500)]
hover:bg-[var(--color-brand-300)]
focus:outline-none focus:ring-4 focus:ring-pink-400/40
shadow-panel
```

### Secondary Button
```
inline-flex items-center gap-2 rounded-xl px-4 py-2
bg-transparent border border-border text-text
hover:bg-panel
focus:outline-none focus:ring-4 focus:ring-pink-400/40
```

### Panel/Card
```
rounded-xl bg-panel border border-border shadow-panel
```

### Accent Text (Gradient)
```
bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-[#FF72B6]
```

### Input Field
```
w-full rounded-md border border-border bg-panel px-3 py-2
text-text placeholder:text-muted
focus:outline-none focus:ring-4 focus:ring-pink-400/40 focus:border-brand-500
```

## Shape Language

- **Primary radius**: rounded-xl (16px) for major UI elements
- **Secondary radius**: rounded-md (12px) for smaller elements  
- **Borders**: thin (1px) borders, subtle and understated
- **Focus rings**: 4px pink glow with 40% opacity (`focus:ring-pink-400/40`)

## Layout & Spacing

- **Spacing scale**: 4/8/12/16/24/32/48px (xs/sm/md/lg/xl/2xl/3xl)
- **Use consistent spacing** from the design tokens
- **Maintain generous whitespace** for the minimal aesthetic

## Elevation & Shadows

- **Panel shadow**: `0 6px 24px rgba(255,46,136,0.06)` (subtle pink tint)
- **Use sparingly**: shadows only on elevated panels and modals
- **Brand glow**: use pink shadow for focus states and important CTAs

## Theme Implementation

### CSS Variables Structure
```css
:root {
  /* Light theme as fallback */
  --color-bg: #FFF7FB;
  --color-text: #0B1220;
  /* ... other light colors */
}

[data-theme="dark"] {
  /* Dark overrides */
  --color-bg: #0B1220;
  --color-text: #F8FAFC;
  /* ... other dark colors */
}
```

### Default Theme
- **Start with dark theme** (`data-theme="dark"` on body)
- Light mode available by toggling `[data-theme="light"]`
- Ensure both themes maintain brand color consistency

## Usage Guidelines

### Do ✅
- Use lowercase "bombay" consistently
- Stick to IBM Plex Mono for all text
- Use brand-500 for primary actions
- Maintain generous whitespace
- Use pink sparingly but confidently
- Keep UI minimal and focused

### Don't ❌
- Mix typography (no sans-serif fonts)
- Overuse the pink (let it be an accent)
- Use harsh shadows or heavy borders
- Capitalize "bombay" or write "Bombay"
- Introduce non-technical visual elements
- Create busy or cluttered layouts

## Accessibility Notes

- **Contrast**: brand-500 on panel backgrounds meets WCAG AA standards
- **Focus indicators**: Pink focus rings are visible against dark backgrounds
- **Text contrast**: Never use pink text on colored backgrounds — keep text neutral (white on dark, dark on light)
- **Color blindness**: UI remains functional without color (don't rely on pink alone for meaning)

## Brand Assets

- **Wordmark**: `public/brand/wordmark.svg` with gradient text and caret bar
- **Favicon**: `public/favicon.svg` with monogram-style "b" in brand colors
- **Logo usage**: Always on appropriate background with sufficient contrast

## Technical Implementation

This brand system integrates with:
- **Next.js App Router** with Google Fonts
- **Tailwind CSS** with CSS custom properties
- **Dark/light theme switching** via data attributes
- **Playwright testing** for brand consistency validation