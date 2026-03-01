{
  description = "HACKUDC 2026 environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      pyPkgs = ps: with ps; [
        requests
        fastapi
        fastapi-cli
        sqlmodel
        sqlalchemy
        pydantic
        pylint
        uvicorn
        email-validator
        python-jose
        cryptography
        google-auth
        python-multipart
      ];
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          (python312.withPackages pyPkgs)
          nodejs_22
          sqlite
        ]; # <-- Aquí faltaba el cierre

        shellHook = ''
          echo "HACKUDC 2026 - env loaded!"
          echo "Python: $(python --version)"
          echo "Node:   $(node --version)"
        '';
      };
    };
}
