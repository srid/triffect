mod ci 'ci/mod.just'

nix_shell := if env('IN_NIX_SHELL', '') != '' { '' } else { 'nix develop path:' + justfile_directory() + ' -c' }

# Install dependencies
install:
    {{ nix_shell }} pnpm install

# Run dev server (vite + triplit)
[parallel]
dev: _triplit-dev _vite-dev

_triplit-dev: install
    {{ nix_shell }} pnpm triplit dev

_vite-dev: install
    sleep 1
    {{ nix_shell }} pnpm dev

# Build for production
build: install
    {{ nix_shell }} pnpm build

# Type check
typecheck: install
    {{ nix_shell }} pnpm typecheck

# Run pre-commit hooks
pc:
    pre-commit run --all-files

# Run e2e tests (nix build once, each worker spawns the binary)
test: install
    #!/usr/bin/env bash
    set -euo pipefail
    TRIFFECT_SERVER="$(nix build path:{{ justfile_directory() }} --print-out-paths)/bin/triffect"
    cd tests
    {{ nix_shell }} pnpm install
    TRIFFECT_SERVER="$TRIFFECT_SERVER" {{ nix_shell }} pnpm test

# Run e2e tests against dev server
test-dev: install
    #!/usr/bin/env bash
    set -euo pipefail
    cd tests
    {{ nix_shell }} pnpm install
    TRIFFECT_SERVER="http://localhost:5173" {{ nix_shell }} pnpm test
