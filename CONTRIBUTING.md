Contributing

This document describes, in English, only how to install Nix and how to launch the backend.

1) Install Nix

Follow the official instructions at https://nixos.org/download.html.

Quick install (single-user):

```bash
sh <(curl -L https://nixos.org/nix/install)
```

If your system uses Nix already but flakes are not enabled, add the following line to `~/.config/nix/nix.conf`:

```text
experimental-features = nix-command flakes
```

2) Enter the development shell

This repository provides a `flake.nix`. From the repository root run:

```bash
nix develop
```

This drops you into a reproducible development shell with the tools defined by the flake.

3) Launch the backend

From the repository root (inside the `nix develop` shell) you can run the backend (inside the backend folder):

```bash
fastapi run main.py
```

That's all this file documents: install Nix, enter the dev shell, and run the backend.
