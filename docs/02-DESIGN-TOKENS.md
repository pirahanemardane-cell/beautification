# Phase 2 - Design tokens

Source: src/app/globals.css

## Coral–peach palette
- Light Coral `#f08080` — primary light accent
- Sweet Salmon `#f4978e`
- Powder Blush `#f8ad9d`
- Peach Fuzz `#fbc4ab`
- Soft Apricot `#ffdab9` — dark-mode accent

## Colors (light)
- background #F8F9FA
- foreground / body / UI text #111111 (contrast on pastel)
- primary / secondary / ring #f08080
- primary-foreground #111111
- muted #DEE2E6 / #E9ECEF
- muted-foreground #495057
- destructive #DC2626 / #B3261E
- chart companions #f4978e / #f8ad9d / #fbc4ab / #ffdab9

## Colors (dark)
- background #212529
- foreground / body / UI text #F8F9FA (near-white)
- primary / secondary / ring #ffdab9
- primary-foreground #111111 (readable on Soft Apricot)
- accent #f08080
- No turquoise/teal/cyan brand accents

## Radius
--radius and sm/md/lg/xl/2xl from CSS theme

## Typography
IRANYekanX — H1 900, H2 800, H3 700, body 400, price 700

## Rules
- Prefer semantic classes (bg-primary text-muted-foreground)
- Do not hardcode hex in new UI when token exists
- Respect prefers-reduced-motion
