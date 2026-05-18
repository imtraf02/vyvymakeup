let
  pkgs = import <nixpkgs> {};
in
  pkgs.mkShell {
    buildInputs = [
      pkgs.nodejs
      pkgs.pnpm
      pkgs.gcc
      pkgs.prisma-engines_7
      pkgs.openssl
      pkgs.cacert
    ];

    SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";

    PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines_7}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines_7}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines_7}/lib/libquery_engine.so.node";
    PRISMA_INTROSPECTION_ENGINE_BINARY = "${pkgs.prisma-engines_7}/bin/introspection-engine";
    PRISMA_FMT_BINARY = "${pkgs.prisma-engines_7}/bin/prisma-fmt";

    shellHook = ''
      export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.openssl.out}/lib:$LD_LIBRARY_PATH
      echo "VyVy development environment loaded (Prisma 7 engines from pkgs)."
    '';
  }
