---
name: Tapsakay Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cadbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d3e4fd'
  on-surface: '#0b1d2f'
  on-surface-variant: '#5d3f3d'
  inverse-surface: '#213245'
  inverse-on-surface: '#e9f1ff'
  outline: '#926f6b'
  outline-variant: '#e7bdb9'
  surface-tint: '#c0001a'
  primary: '#bb0019'
  on-primary: '#ffffff'
  primary-container: '#e3202a'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3ad'
  secondary: '#385da2'
  on-secondary: '#ffffff'
  secondary-container: '#90b3fe'
  on-secondary-container: '#194387'
  tertiary: '#7a5500'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6c00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930011'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#aec6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#1b4589'
  tertiary-fixed: '#ffdeaa'
  tertiary-fixed-dim: '#ffba2f'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#f8f9ff'
  on-background: '#0b1d2f'
  surface-variant: '#d3e4fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system is crafted specifically for daily commuters navigating public transport networks (motorelas, jeepneys, and campus/city shuttles). The brand ethos bridges functional grassroots transit with crisp, reliable mobile utility encapsulated by the tagline: "Tap. Match. Sakay." 

### Brand Personality & Emotional Impact
- **Decisive & Dependable:** Commuters are frequently moving in busy transit terminals under bright sunlight or rushing between destinations. The UI conveys instant legibility, structural clarity, and zero ambiguity.
- **Vibrant & Accessible:** Infused with local mobility pride, balancing energetic crimson red accents with deeply authoritative navy tones.
- **Effortless & Direct:** Interaction patterns reduce friction—large tap targets, high-contrast feedback states, and clear route visualizers ensure rapid decision-making while walking or boarding.

### Design Movement & Aesthetic Language
The visual style merges **Modern Utility & Bold Contrast** with soft geometric card structures. High-contrast typography paired with structured tonal surfaces gives the app an agile, civic transit-app feel. Bold status indicators, high-contrast route nodes, and crisp touch elements guarantee that key trip information is immediately distinguishable at a glance.

## Colors

The palette balances primary action urgency, deep structural readability, operational warnings, and clean canvas neutrals:

### Primary & Action Red
- **Primary / Brand Action (`#e3202a`):** Used for key calls-to-action (Request Ride, Confirm Destination, Get Started), live location indicators, and brand identity marks.
- **Secondary Soft Red (`#d74850`):** Pressed/hover states for primary actions, critical alerts, and route milestone badges.
- **Accent Red Tint (`#db989c`):** Subtle background highlights, soft selection rings, and border accents for active alerts.

### Deep Navy & Structured Text
- **Deep Navy (`#04377b`):** The primary color for titles, major station headers, active step indicators, and primary body contrast against white canvases.
- **Secondary Slate Blue (`#375887`):** Secondary headers, route titles, and supportive metadata.
- **Muted Blue-Gray (`#8d9eb5`):** Inactive icons, subtle divider strokes, non-selected station dots, and secondary metadata.

### Warm Accent & Status
- **Amber Yellow (`#f4ae0b`):** In-transit status pills ("On the Way", "Matching..."), warning banners, driver arrival notifications, and live vehicle highlights.
- **Soft Yellow Tint (`#e6c87d`):** Notification card container fills and contextual banner backgrounds.

### Neutrals & Surfaces
- **Canvas Base (`#e2e1e1`):** Exterior viewport background and device frame framing.
- **Pure White (`#ffffff`):** Screen canvas and bottom sheet backgrounds.
- **Card Background (`#f8f9fa`):** Input containers, station selector rows, passive list tiles, and floating sheets.

## Typography

The design system standardizes on **Plus Jakarta Sans** across all roles. Its geometric construction, crisp apertures, and open counters provide maximum legibility on mobile screens under variable ambient light and movement.

- **Headlines:** Set in bold and extrabold weights. Used for high-impact screens (Welcome branding, Active Station headings, Trip Status).
- **Body:** Neutral and clean, ensuring fast scanning of driver names, ETA values, and terminal lists.
- **Labels:** Explicitly structured with high weights (600–700) for numeric station stops, status chips, passenger counters, and CTA buttons.

## Layout & Spacing

The layout architecture relies on a **Fluid Mobile-First Grid** optimized for standard one-handed mobile ergonomic zones.

### Principles & Breakpoints
- **Mobile Canvas (360px – 430px):** Single-column stack with persistent `margin` of `1rem` (16px). All key interactive controls (Booking buttons, confirmation sheets) occupy the lower 45% screen thumb zone.
- **Tablet / Expanded Viewports (431px – 768px):** Centered phone canvas container (`max-width: 480px`) with balanced ambient outer guttering to preserve native app ergonomics.
- **Vertical Rhythm:** A strict 4px/8px baseline grid maintains consistency across station timelines, stepper rows, and summary cards.

## Elevation & Depth

Visual hierarchy leverages crisp tonal layering supported by low-opacity, ambient shadows tinted subtly by Deep Navy (`#04377b`).

- **Surface Level 0 (Canvas):** Pure White (`#ffffff`) or light slate tint (`#f8f9fa`) for background screens.
- **Surface Level 1 (Cards & Modules):** Elevated by soft borders (`1px solid #e2e1e1`) and an ambient shadow: `0px 2px 8px rgba(4, 55, 123, 0.06)`. Used for station choices, driver summary tiles, and passenger stepper modules.
- **Surface Level 2 (Floating Action Panels & Drawers):** Bottom-anchored booking sheets and active trip banners utilize `0px -4px 16px rgba(4, 55, 123, 0.10)`.
- **Surface Level 3 (Modals & Alerts):** Prominent focus states with `0px 10px 28px rgba(4, 55, 123, 0.16)`.

## Shapes

The design system adopts a **Rounded** shape language (`roundedness: 2` with standard radii of `0.5rem` / 8px for standard components, extending to `1rem` / 16px for cards and containers).

- **Primary Buttons & Action Triggers:** Standardized at `0.75rem` (12px) to provide a soft yet structured tactile target.
- **Cards, Sheets & Map Overlays:** Enclosed with `1rem` (16px) corner radii for a contemporary, friendly silhouette.
- **Selection Pills & Station Badges:** Fully circular or capsule-pill shaped (`9999px`) for quick visual identification.

## Components

### Buttons
- **Primary Action (e.g., "Request Ride", "Confirm"):** High-contrast red fill (`#e3202a`), pure white text, bold weight (`label-lg`), minimum height `52px` to accommodate rapid commuter taps. Active state darkens to `#d74850`.
- **Secondary / Outline Action (e.g., "Select Other Station", "Cancel"):** Border `1.5px solid #375887`, text `#04377b`, transparent background. On tap, receives subtle neutral fill `#f8f9fa`.
- **Emergency Button:** High-visibility outline or solid block with phone icon, styled in secondary slate or brand red tint for rapid commuter safety access.

### Passenger Stepper Counter
- Horizontal modular card enclosing a large numeric counter (`headline-md`) bordered by equal-dimensioned square buttons (`-` and `+`). Minimum touch area `48x48px` with clear disabled state on minus when count is 1.

### Station Destination Selector & Radio List
- **Passive State:** `#ffffff` surface, `1px solid #e2e1e1` stroke, radio icon in `#8d9eb5`.
- **Selected State:** Bordered in primary red (`#e3202a`) with a soft red fill background (`#db989c` at 12% opacity). Radio button displays a dual concentric ring with a solid center dot.

### Matching & Driver Found Card
- Includes driver avatar / vehicle graphic, driver name, vehicle plate/code ("Rela 03"), ETA pill badge, and seat availability indicator.
- Vehicle graphic is housed in a rounded neutral container (`#f8f9fa`) with deep navy typography.

### Route Timeline & Live Trip Status
- **Progress Bar / Node Tracker:** Horizontal node progression connecting pickup to destination.
  - Completed stops: Solid `#04377b` circle.
  - Active / Current stop: Pulsing target node with primary red `#e3202a` center and outer soft red ring.
  - Upcoming stops: Dashed connector line with hollow slate-gray (`#8d9eb5`) circles.
- **Status Pills:** Pill badge (`#f4ae0b` background with dark navy text `#04377b`) displaying trip state: "Matching", "Arriving", or "On the Way".

## Connected account and ride surfaces

Account screens reuse the existing Jakarta typography, navy headings, red primary actions, and 52px controls. Labeled email/password inputs support registration, login, verification, and password recovery. Forms scroll and adjust for the keyboard. Submission errors are announced as alerts; confirmations use polite live regions.

The authenticated shell derives its passenger or driver navigation from the account. Driver request and passenger tabs show one card per group, with station names, seat count, status, and actions appropriate to the server state. Availability separates onboard seats from reservations. Offline state presents a refresh action and disables ride mutations. The responsive shell retains the centered 520px maximum width.

Runtime font names `Jakarta`, `JakartaMedium`, `JakartaSemi`, `JakartaBold`, and `JakartaExtra` are the Expo aliases for Plus Jakarta Sans. The existing outer viewport color is `#e8edf7`; it frames the centered app on wider screens.

## Passenger home

The passenger home opens with a greeting, a compact avatar, and one dominant booking panel. The primary action is the red `Book a ride` button; route context follows as a five-stop strip, then a driver-reported map and nearby rela availability cards. Active rides replace the booking panel at the same position so current travel always has priority. Keep the home as a task surface: short copy, strong navy headings, red only for action, and status colors reserved for availability and progress.
