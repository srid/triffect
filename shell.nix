{ pkgs ? import ./nix/nixpkgs.nix { system = builtins.currentSystem; } }:

pkgs.mkShell {
  name = "triffect-shell";
  packages = with pkgs; [
    just
    nodejs
    pnpm
    tsx
    pre-commit
    nixpkgs-fmt
    nodePackages.prettier
  ];
  shellHook = ''
    pre-commit install --allow-missing-config 2>/dev/null || true
  '';
}
