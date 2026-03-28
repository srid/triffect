{ config, lib, ... }:
let
  cfg = config.services.triffect;
in
{
  options.services.triffect = {
    enable = lib.mkEnableOption "triffect affect journaling PWA";

    package = lib.mkOption {
      type = lib.types.package;
      description = "The triffect package to use.";
    };

    host = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Address to listen on.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 8080;
      description = "Port to listen on.";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.user.services.triffect = {
      Unit = {
        Description = "Triffect affect journaling";
        After = [ "network.target" ];
      };
      Service = {
        ExecStart = lib.getExe cfg.package;
        Environment = [
          "TRIFFECT_HOST=${cfg.host}"
          "TRIFFECT_PORT=${toString cfg.port}"
        ];
        Restart = "on-failure";
      };
      Install = {
        WantedBy = [ "default.target" ];
      };
    };
  };
}
