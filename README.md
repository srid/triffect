# Triffect

Triangular affect journaling. Tap a point inside a triangle to log where you are on the good / bad / felicitous spectrum, optionally attach a note, and track patterns over time.

The three vertices map to [actualfreedom.com.au](http://actualfreedom.com.au)'s categorization of feelings:

- **Bad** (red) — malice and sorrow
- **Good** (pink) — love and compassion
- **Felicitous** (green) — the naive, innocuous, felicitous feelings characteristic of the actual world

Your tap position is stored as [barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system) — three values ∈ [0,1] that sum to 1, representing proximity to each vertex.

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

## Auth

None. Designed for single-user self-hosting behind [Tailscale](https://tailscale.com/) or equivalent.

## Tests

```sh
just test       # build + e2e (Cucumber/Playwright)
just test-dev   # e2e against running dev server
```

## CI

```sh
just ci         # runs nix build + e2e on all configured systems
just ci protect # sets up GitHub branch protection from CI checks
```

## References

- [actualfreedom.com.au](http://actualfreedom.com.au) — the affect categorization this app is based on
- [Triplit docs](https://www.triplit.dev/docs) — local-first database with sync
- [Barycentric coordinates](https://en.wikipedia.org/wiki/Barycentric_coordinate_system) — the coordinate system used for triangle positions
