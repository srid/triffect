# Zero-input flake: uses npins instead of flake inputs to avoid
# fetcher-cache verification overhead (~1.5s per input).
{
  description = "Triffect — Triangular affect journaling";

  nixConfig = {
    extra-substituters = "https://cache.nixos.asia/oss";
    extra-trusted-public-keys = "cache.nixos.asia-1:1MOnjNuRDKKnXjtiDcLCZw0OPnMaRCGa2TdXiPJQ/N0=";
  };

  outputs = _:
    let
      systems = [ "x86_64-linux" "aarch64-darwin" ];
      forAllSystems = f: builtins.listToAttrs (
        map (system: { name = system; value = f system; }) systems
      );
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import ./nix/nixpkgs.nix { inherit system; };
        in
        {
          default = import ./shell.nix { inherit pkgs; };
        });
    };
}
