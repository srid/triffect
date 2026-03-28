# Triffect

Triangular affect journaling. Tap a point inside a triangle to log where you are on the good / bad / naivete spectrum, optionally attach a note, and track patterns over time.

The three vertices map to [actualfreedom.com.au](http://actualfreedom.com.au)'s categorization of feelings:

- **Naivete** (green, top) — the naive, innocuous, felicitous feelings characteristic of the actual world
- **Bad** (red, bottom-left) — malice and sorrow
- **Good** (pink, bottom-right) — love and compassion

Your tap position is stored as [barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system) — three values ∈ [0,1] that sum to 1, representing proximity to each vertex.

## GitHub Pages

A static build is deployed to GitHub Pages on every push to `master`. All data lives in your browser's IndexedDB via [Triplit](https://www.triplit.dev/) — nothing leaves the device. No server, no account, no sync.

> [!IMPORTANT]
> Clearing browser data deletes all entries. Export functionality is not yet implemented.

## Schema

Each entry stores a point in the triangle plus an optional note:

| Field        | Type              | Description                              |
| ------------ | ----------------- | ---------------------------------------- |
| `id`         | string (auto)     | Unique identifier                        |
| `good`       | number [0,1]      | Barycentric weight toward Good vertex    |
| `bad`        | number [0,1]      | Barycentric weight toward Bad vertex     |
| `naivete`    | number [0,1]      | Barycentric weight toward Naivete vertex |
| `note`       | string (optional) | Free-text note attached to the entry     |
| `created_at` | date              | Timestamp of the entry                   |

The three barycentric coordinates always sum to 1. A tap near the Naivete vertex produces high `naivete`, low `good` and `bad`.

## Stack

| Layer   | Choice                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------- |
| UI      | [SolidJS](https://www.solidjs.com/) + [TailwindCSS v4](https://tailwindcss.com/)                  |
| Data    | [Triplit](https://www.triplit.dev/) — local-first with IndexedDB, auto-sync to self-hosted server |
| Build   | [Vite](https://vite.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)                  |
| Tests   | [Cucumber](https://cucumber.io/) + [Playwright](https://playwright.dev/)                          |
| Dev env | Nix flake (zero-input, [npins](https://github.com/andir/npins))                                   |
| CI      | [`just ci`](ci/) — distributed across systems via SSH, posts GitHub commit statuses               |

## Setup

```sh
nix develop    # or: direnv allow
just install
just dev       # starts Vite + Triplit dev server
```

## Self-hosting

A home-manager module is provided for NixOS deployment behind Tailscale or equivalent. No auth — single-user by design.

```nix
services.triffect = {
  enable = true;
  package = triffect.packages.x86_64-linux.default;
  port = 8080;
};
```

## Tests

```sh
just test       # build + e2e (Cucumber/Playwright)
just test-dev   # e2e against running dev server
```

## CI

```sh
just ci         # runs nix build + home-manager + e2e on all configured systems
just ci protect # sets up GitHub branch protection from CI checks
```

## References

- [actualfreedom.com.au](http://actualfreedom.com.au) — the affect categorization this app is based on
- [Triplit docs](https://www.triplit.dev/docs) — local-first database with sync
- [Barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system) — the coordinate system used for triangle positions
