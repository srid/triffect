{ system }:
let
  sources = import ../npins;
in
import sources.nixpkgs {
  inherit system;
}
