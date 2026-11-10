# Phase 2 - Design tokens

Source: src/app/globals.css

## Colors (light)
- background #F8F9FA
- foreground #212529 (readable body); brand-tinted text #5c3a42 where accented
- primary / secondary / ring #f5a3af
- primary-foreground #212529
- muted #DEE2E6 / #E9ECEF
- muted-foreground #495057
- destructive #DC2626 / #B3261E
- chart companion pastel #f9c5cd

## Colors (dark)
- background #212529
- foreground / primary / secondary / ring #fdedef
- primary-foreground #212529
- accent #f5a3af (soft pastel derivative)
- No turquoise/teal/cyan brand accents

## Radius
--radius and sm/md/lg/xl/2xl from CSS theme

## Typography
IRANYekanX — H1 900, H2 800, H3 700, body 400, price 700

## Rules
- Prefer semantic classes (bg-primary text-muted-foreground)
- Do not hardcode hex in new UI when token exists
- Respect prefers-reduced-motion
