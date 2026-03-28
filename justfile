mod ci 'ci/mod.just'

nix_shell := if env('IN_NIX_SHELL', '') != '' { '' } else { 'nix develop path:' + justfile_directory() + ' -c' }

# Install dependencies
install:
    {{ nix_shell }} pnpm install

# Run dev server (vite + triplit)
dev: install
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    {{ nix_shell }} pnpm triplit dev &
    sleep 1
    {{ nix_shell }} pnpm dev &
    wait

# Build for production
build: install
    {{ nix_shell }} pnpm build

# Type check
typecheck: install
    {{ nix_shell }} pnpm typecheck

# Run pre-commit hooks
pc:
    pre-commit run --all-files

# Run e2e tests (full build + test)
test: build
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    cd tests && {{ nix_shell }} pnpm install && cd ..
    {{ nix_shell }} pnpm preview &
    sleep 2
    TRIFFECT_SERVER="http://localhost:4173" {{ nix_shell }} pnpm --prefix tests test
    kill %1 2>/dev/null || true

# Run e2e tests against dev server
test-dev:
    #!/usr/bin/env bash
    set -euo pipefail
    cd tests && {{ nix_shell }} pnpm install && cd ..
    TRIFFECT_SERVER="http://localhost:5173" {{ nix_shell }} pnpm --prefix tests test
