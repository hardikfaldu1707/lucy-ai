# Create wizard option images (local uploads)

The create wizard loads **only** files from this folder — no stock/Unsplash fallbacks. Each option has its own file; **do not reuse the same image** across options.

Until you upload a file, the card shows a pink gradient and the option label. After adding `.webp` files, run `npm run sync:create-options` so the app picks them up.

## Specs

- Format: **WebP** (`.webp`)
- Size: **480×720** (3:4 portrait) recommended
- One **unique** image per row below — image should match the label (e.g. Blonde shows blonde hair)

## Upload checklist (34 files)

Place files under `public/create/options/`:

### Style (`style/`)

| File | Label |
|------|-------|
| `realistic.webp` | Realistic |
| `anime.webp` | Anime |

### Hair style (`hair-style/`)

| File | Label |
|------|-------|
| `straight-long.webp` | Straight long |
| `wavy.webp` | Wavy |
| `curly.webp` | Curly |
| `bob.webp` | Bob cut |
| `ponytail.webp` | Ponytail |
| `braids.webp` | Braids |
| `pixie.webp` | Pixie |
| `bun.webp` | Bun |

### Hair color (`hair-color/`)

| File | Label |
|------|-------|
| `black.webp` | Black |
| `brown.webp` | Brown |
| `blonde.webp` | Blonde |
| `red.webp` | Red |
| `auburn.webp` | Auburn |
| `platinum.webp` | Platinum |
| `pink.webp` | Pink |
| `blue.webp` | Blue |

### Body (`body/`)

| File | Label |
|------|-------|
| `slim.webp` | Slim |
| `athletic.webp` | Athletic |
| `curvy.webp` | Curvy |
| `petite.webp` | Petite |
| `tall.webp` | Tall |
| `voluptuous.webp` | Voluptuous |

### Outfit (`outfit/`)

| File | Label |
|------|-------|
| `casual.webp` | Casual |
| `dress.webp` | Dress |
| `sporty.webp` | Sporty |
| `elegant.webp` | Elegant |
| `lingerie.webp` | Lingerie |
| `cosplay.webp` | Cosplay |
| `business.webp` | Business |
| `beachwear.webp` | Beachwear |

## Machine-readable list

See [`MANIFEST.json`](./MANIFEST.json) for the same entries with `category`, `optionId`, `label`, and `path`.

Code registry: [`src/constants/create-option-images.ts`](../../src/constants/create-option-images.ts) (`CREATE_OPTION_MANIFEST`).
