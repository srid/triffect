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

# Run e2e tests (full build + test, single nix-shell for speed)
test:
    {{ nix_shell }} bash -c '\
      set -euo pipefail; \
      trap "kill 0" EXIT; \
      pnpm install; \
      pnpm build; \
      cd tests && pnpm install && cd ..; \
      pnpm preview --port 4173 & \
      sleep 2; \
      TRIFFECT_SERVER="http://localhost:4173" pnpm --prefix tests test'

# Run e2e tests against dev server
test-dev:
    {{ nix_shell }} bash -c '\
      cd tests && pnpm install && cd ..; \
      TRIFFECT_SERVER="http://localhost:5173" pnpm --prefix tests test'
