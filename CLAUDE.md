# Triffect

## Schema

The Triplit schema field names (`good`, `bad`, `naivete`) are stored in IndexedDB on users' devices. **Never rename or remove schema fields** — this would silently break existing data. Add new fields only; migrate if absolutely necessary.

Display labels (e.g. "Sensuous" for the `naivete` field) can change freely since they're UI-only.

## Target Device

Primary use is on **Android phone as an installed PWA**. All UI work must be mobile-first — test at narrow widths, ensure touch targets are large enough, and avoid hover-dependent interactions.
