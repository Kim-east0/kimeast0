---
name: Site Engineering Operations Hub
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#111c2d'
  on-tertiary-container: '#79849a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  badge-status:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

### Personality & Emotional Response
The design system embodies the rigor, precision, and operational stability demanded by construction enterprise engineering headquarters. It balances institutional authority with modern software clarity. The emotional outcome must evoke total control, zero ambiguity, and high confidence during rapid risk assessments across active construction sites.

### Design Movement: Structured Corporate Precision
Drawing inspiration from industrial data instrumentation and disciplined enterprise software:
- **High-Density Utility**: Maximizes viewport efficiency on desktop monitors (1920x1080 and 1440x900 standards) without visual clutter.
- **Architectural Framing**: Employs fine borders, hairline dividers, and muted slate surfaces rather than heavy drop shadows to structure data hierarchically.
- **Data-First Focus**: Chrome and navigation fade into deep corporate navy foundations, elevating high-stakes variance indicators, financial tallies, and site progress metrics.

## Colors

### Surface & Frame Tokens
- **Canvas Base**: `#F8FAFC` (Cool Slate 50) provides an anti-glare, pristine foundation for continuous desktop operation.
- **Container / Card Background**: `#FFFFFF` for primary work surfaces and grid cards.
- **Sub-surface / Table Header**: `#F1F5F9` (Slate 100) separates column labels and data clusters cleanly.
- **Structural Borders**: `#E2E8F0` (Slate 200) for standard layout and table gridlines; `#CBD5E1` (Slate 300) for interactive control boundaries.

### Executive & Interactive Palette
- **Primary (Institutional Frame)**: `#0F172A` (Slate 900) anchors the global top navigation, side rail, and primary high-weight typography.
- **Secondary (Action & Focus)**: `#2563EB` (Blue 600) drives action buttons, active navigation states, selected row highlights, and deep links. Hover state: `#1D4ED8`. Focus ring: `#93C5FD`.
- **Tertiary (Secondary Framing)**: `#1E293B` (Slate 800) defines section titles, secondary toolbars, and inactive modal backdrops.
- **Neutral Text**: `#0F172A` (Headline/Value), `#334155` (Body/Labels), `#64748B` (Secondary captions/Units), `#94A3B8` (Disabled states).

### Specialized Operations Status Palette (Threshold Strict)
Each threshold must couple color with an explicit semantic label:
- **정상 (Normal | Variance ≥ 0.0pp)**:
  - Text/Icon: `#16A34A` (Green 600)
  - Surface Badge: `#F0FDF4` (Green 50)
  - Border: `#BBF7D0` (Green 200)
  - Mandatory Text Indicator: `정상`
- **주의 (Warning | -5.0pp < Variance < 0.0pp)**:
  - Text/Icon: `#D97706` (Amber 600)
  - Surface Badge: `#FFFBEB` (Amber 50)
  - Border: `#FDE68A` (Amber 200)
  - Mandatory Text Indicator: `주의`
- **점검 (Inspection Required | Variance ≤ -5.0pp)**:
  - Text/Icon: `#DC2626` (Red 600)
  - Surface Badge: `#FEF2F2` (Red 50)
  - Border: `#FECACA` (Red 200)
  - Mandatory Text Indicator: `점검`

## Typography

### Font Hierarchy & Roles
- **Primary Interface Font**: Inter (with full support for native Korean font fallback system stacks such as Pretendard, Apple SD Gothic Neo, and Malgun Gothic). Used across page titles, column headers, descriptive metadata, and inputs.
- **Numerical Data & Metrics Font**: JetBrains Mono. Mandatory for currency, percentages, variance markers, and timestamps to guarantee strict tabular alignment (`font-variant-numeric: tabular-nums`).

### Formats & Numerical Standards
- **Currency Format**: Values are scaled strictly to millions (`백만원`). Digits must follow standard thousand-grouping commas with obligatory single decimal point formatting: `1,248.5백만원`.
- **Ratio Format**: Strict single decimal point with direct suffix: `94.2%`.
- **Variance Format**: Expressed explicitly with `+` or `-` signed symbols and `pp` unit indicator: `+1.8pp`, `-6.4pp`.

## Layout & Spacing

### Desktop Layout Engine
- **Primary Grid Structure**: 12-column desktop grid tailored for enterprise PC views (min-width: 1280px, optimized for 1920px displays).
- **Global Header**: Fixed height of 56px (`#0F172A`), edge-to-edge. Contains system identity, division switcher, operational quarter selector, sync indicator, and user credentials.
- **Top Utility & Filter Bar**: Fixed height of 48px immediately below the global header, providing cross-site filters (e.g., 공구별, 공정률 단계, 리스크 등급).
- **Dashboard Workspace Canvas**: Fluid width with maximum width bounding at 1920px, framed by `margin` (24px) on left, right, and bottom.
- **12-Site Simultaneous Comparison Model**: 
  - Top Deck: 4-Column Summary KPI Cards (Aggregated Contract, Total Cost, Plan vs Actual Progress, Red Flag Counts).
  - Main Body: 12-Site High-Density Comparative Grid Table spanning 12 columns, with horizontal split capability to compare 6+6 sites or anchor critical engineering lines via sticky column pins.

## Elevation & Depth

### Flat Precision Architecture
Avoid decorative blurs, neomorphic drops, or high-radius ambient shadows. In this high-density engineering environment, depth is achieved purely through hairline borders and muted tonal contrast.

- **Level 0 (App Shell Background)**: `#F8FAFC`. Base canvas floor.
- **Level 1 (Data Cards & Table Body)**: `#FFFFFF` surfaced with a solid 1px border (`#E2E8F0`). Flat elevation, 0px shadow.
- **Level 2 (Table Header & Section Dividers)**: `#F1F5F9` nested directly within Level 1 cards to isolate metadata cleanly.
- **Level 3 (Hover States & Row Focus)**: Background shift to `#F8FAFC` on hover with a 1px left accent stroke (`#2563EB`) on selected table rows.
- **Level 4 (Flyout Filter Panels & Modals)**: Retains `#FFFFFF` background with a subtle, structured outline (`#CBD5E1`) and a functional 0 4px 12px rgba(15, 23, 42, 0.08) drop shadow to separate overlaid tools from base operational tables.

## Shapes

### Strict Crisp Corner System
- **Level 1 (Soft)**: UI shapes adhere strictly to low-radius corners. General input boxes, status badges, buttons, and individual KPI tiles use `0.25rem` (4px) radius.
- **Data Table Containers**: Outer frame capped at `0.375rem` (6px) radius to maintain structured edge geometry with sharp 0px inner cells.
- **Badges**: 4px radius (`0.25rem`). Pill-shaped (fully rounded) tags are banned to prevent visual friction with tabular metrics.

## Components

### Status Indicator Badges (Mandatory Schema)
All site progress and budget status tags must pair color fill, border, numerical variance, and explicit Korean status labels:
- **정상 Badge**:
  - Container: `#F0FDF4`, Border: 1px solid `#BBF7D0`, Text: `#16A34A` (`badge-status`).
  - Text Pattern: `정상 (+1.2pp)` or simply `정상` with variance displayed in adjacent tabular cell.
- **주의 Badge**:
  - Container: `#FFFBEB`, Border: 1px solid `#FDE68A`, Text: `#D97706` (`badge-status`).
  - Text Pattern: `주의 (-2.4pp)`
- **점검 Badge**:
  - Container: `#FEF2F2`, Border: 1px solid `#FECACA`, Text: `#DC2626` (`badge-status`).
  - Text Pattern: `점검 (-7.8pp)`

### Comparative Data Table (12 Sites Unified View)
- **Cell Compactness**: Fixed row height of 40px for maximum vertical density.
- **Header Styling**: `#F1F5F9` background, 32px height, 1px bottom border `#CBD5E1`. Typography uses `body-xs` bold in `#475569`.
- **Column Alignment Rules**:
  - Text attributes (현장명, 공사분야, 현장소장): Left-aligned (`body-sm`).
  - Status indicator badges: Centered.
  - Financial tallies and percentages: Right-aligned (`label-numeric-md`), padded right by `space-md`.
- **Sticky Column Features**: The first two columns (Site Code & Site Name) are frozen on horizontal scroll with a subtle 1px vertical border separator (`#CBD5E1`).

### Primary KPI Metric Cards
- **Structure**: 4-column layout above the main data table.
- **Content Flow**: 
  - Top: Label (`body-xs`, `#64748B`, uppercase/bold).
  - Center: High-impact metric (`label-numeric-lg`, `#0F172A`).
  - Bottom: Sub-metric comparison line (e.g., `전월 대비 +15.2백만원` or `계획 대비 -2.1pp 주의`).

### Inputs, Search & Selectors
- **Height**: Compact 32px standard height across text inputs, dropdown selects, and datepickers.
- **Border**: 1px solid `#CBD5E1`, internal background `#FFFFFF`, text `#0F172A` (`body-sm`).
- **Focus State**: 1px solid `#2563EB` with an outer outline ring of 2px `#93C5FD` at 50% opacity.

### Buttons
- **Primary Button**: Solid `#2563EB`, text `#FFFFFF`, height 32px, padding 0 12px, font `body-sm` (600 weight).
- **Secondary Button**: Solid `#FFFFFF`, border 1px solid `#CBD5E1`, text `#334155`. Hover: `#F8FAFC`.
- **Danger Action**: Solid `#DC2626`, text `#FFFFFF` for critical operational overrides.