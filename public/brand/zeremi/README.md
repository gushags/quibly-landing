# Zeremi Brand Assets

Generated 2026-05-27 from `~/Desktop/z-icon.svg` (user-supplied final Z mark) using Inkscape 1.3.2.

## Files

### Source SVGs (`src/`)
| File | Size | Purpose |
|------|------|---------|
| `zeremi-icon-square.svg` | 1024×1024 | Gradient chip with rounded square (rx=232, ~22.65%) — iOS-style squircle |
| `zeremi-icon-circle.svg` | 1024×1024 | Gradient chip with full circle |
| `zeremi-mark.svg` | 56×88 (aspect-fit) | Gradient Z on transparent background — for use on custom surfaces |

### PNG exports (`png/`)
- **Square chip:** 16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024
- **Circle chip:** 16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024
- **Mark only (transparent):** 32, 64, 128, 256, 512, 1024 (preserves 56:88 aspect)

## Design system

- **Gradient:** `linear-gradient(to bottom right, #0D9488, #14b8a6)` — direct port of the existing Quibly `QuibsAvatar` gradient (`marketing-app/components/quibs/quibs-avatar.tsx:28`)
- **Icon fill:** `#ffffff` (white)
- **Square corner radius:** 22.65% of side (iOS app-icon squircle approximation)

## Common use mapping

| Use | File |
|-----|------|
| Favicon (32×32) | `png/zeremi-icon-square-32.png` |
| Favicon (16×16) | `png/zeremi-icon-square-16.png` |
| Apple touch icon (180×180) | `png/zeremi-icon-square-180.png` |
| Android home screen (192) | `png/zeremi-icon-square-192.png` |
| PWA / large display (512) | `png/zeremi-icon-square-512.png` |
| App store / hi-res (1024) | `png/zeremi-icon-square-1024.png` |
| Chat avatar / inline UI | `png/zeremi-icon-square-{32,48,64}.png` |
| FAB / hero avatar | `png/zeremi-icon-circle-{96,128}.png` |
| Email signature / Slack | `png/zeremi-icon-circle-256.png` |
| OG image overlay | `png/zeremi-mark-{256,512}.png` |
| Loading spinner / mark on color | `png/zeremi-mark-{64,128}.png` |

## Regenerating

```bash
cd public/brand/zeremi
INK=/Applications/Inkscape.app/Contents/MacOS/inkscape

# Square + circle (square aspect)
SIZES=(16 32 48 64 96 128 180 192 256 512 1024)
for shape in square circle; do
  for size in "${SIZES[@]}"; do
    "$INK" --export-type=png --export-filename="png/zeremi-icon-${shape}-${size}.png" \
      --export-width=$size --export-height=$size "src/zeremi-icon-${shape}.svg"
  done
done

# Mark (56:88 aspect — height = width * 88/56)
for size in 32 64 128 256 512 1024; do
  h=$(( size * 88 / 56 ))
  "$INK" --export-type=png --export-filename="png/zeremi-mark-${size}.png" \
    --export-width=$size --export-height=$h "src/zeremi-mark.svg"
done
```
