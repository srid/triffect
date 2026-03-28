# Triffect

## Schema

The Triplit schema field names (`good`, `bad`, `naivete`) are stored in IndexedDB on users' devices. **Never rename or remove schema fields** — this would silently break existing data. Add new fields only; migrate if absolutely necessary.

Display labels (e.g. "Sensuous" for the `naivete` field) can change freely since they're UI-only.
