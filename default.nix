# Nix package for Triffect: builds the Vite PWA and wraps a static server.
{ pkgs ? import ./nix/nixpkgs.nix { system = builtins.currentSystem; } }:
let
  nodejs = pkgs.nodejs;
  pnpm = pkgs.pnpm;

  src = pkgs.lib.fileset.toSource {
    root = ./.;
    fileset = pkgs.lib.fileset.unions [
      ./package.json
      ./pnpm-lock.yaml
      ./tsconfig.json
      ./vite.config.ts
      ./index.html
      ./triplit
      ./src
      ./public
    ];
  };

  pnpmDeps = pkgs.fetchPnpmDeps {
    pname = "triffect";
    version = "0.1.0";
    inherit src;
    hash = "sha256-F0JxyJwBHNuJzKvHmKg2IisQc4m5VdnxIisP1GHN1+U=";
    fetcherVersion = 3;
  };

  dist = pkgs.stdenv.mkDerivation {
    pname = "triffect";
    version = "0.1.0";
    inherit src;

    nativeBuildInputs = [ nodejs pnpm pkgs.pnpmConfigHook ];
    inherit pnpmDeps;

    buildPhase = ''
      runHook preBuild
      pnpm build
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      cp -r dist $out
      runHook postInstall
    '';
  };
in
{
  inherit dist;

  default = pkgs.writeShellApplication {
    name = "triffect";
    runtimeInputs = [ pkgs.static-web-server ];
    text = ''
      echo "Serving Triffect on http://''${TRIFFECT_HOST:-127.0.0.1}:''${TRIFFECT_PORT:-8080}"
      exec static-web-server \
        --host "''${TRIFFECT_HOST:-127.0.0.1}" \
        --port "''${TRIFFECT_PORT:-8080}" \
        --root "${dist}" \
        --page-fallback "${dist}/index.html"
    '';
  };
}
