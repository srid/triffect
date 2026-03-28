# Example NixOS configuration using triffect's home-manager module.
# Built in CI to ensure the module evaluates correctly.
{
  inputs = {
    # In CI, localci builds this with --override-input flake pointing to the repo root.
    flake.url = "github:srid/triffect";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { nixpkgs, home-manager, flake, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      triffectModule = {
        boot.loader.grub.devices = [ "nodev" ];
        fileSystems."/" = { device = "none"; fsType = "tmpfs"; };
        system.stateVersion = "24.11";

        users.users.alice = {
          isNormalUser = true;
          initialPassword = "pass";
        };

        home-manager.users.alice = {
          imports = [ flake.homeManagerModules.default ];
          services.triffect = {
            enable = true;
            package = flake.packages.${system}.default;
          };
          home.stateVersion = "24.11";
        };
      };
    in
    {
      nixosConfigurations.example = nixpkgs.lib.nixosSystem {
        inherit system;
        modules = [
          home-manager.nixosModules.home-manager
          triffectModule
        ];
      };
    };
}
