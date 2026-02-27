Contributing

Thank you for contributing to this project! This document explains how to set up the development environment and run the project with the current repository layout.

Overview / Contract
- Inputs: repository root containing flake.nix and a backend/ package.
- Output: a development shell with Python 3.12, uvicorn, and other Python deps available, plus Node.js and SQLite.
- Success criteria: you can enter the development shell and run the backend using either python or uvicorn.

Quickstart (recommended — Nix Flake)
This repository provides a Nix flake (flake.nix) that defines a development shell with the required tools and Python packages.

1. Install Nix (if you don't have it): follow the official instructions at https://nixos.org/download.html.
2. Enable flakes if your Nix setup doesn't already support them. One simple way is to add this to ~/.config/nix/nix.conf:

   experimental-features = nix-command flakes

3. From the repository root run:

   nix develop
   
This will drop you into a shell with:

- Python 3.12 and the project's Python packages (requests, fastapi, uvicorn, sqlmodel, pylint, ...)
- Node.js 22
- sqlite

When the shell loads, you should see messages like "HACKUDC 2026 - env loaded!" and the Python/Node versions.

Running the backend

There are two common ways to run the backend depending on what backend/main.py contains:

- If backend/main.py is a script (contains a if __name__ == "__main__": runner):

   python backend/main.py

- If the backend provides a FastAPI (or ASGI) application object (commonly named app), start it with uvicorn (recommended during development for auto-reload):

   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

Replace backend.main:app with the correct import path if your app object is named or located differently.

Note: at the time of writing, backend/main.py is empty; add your app or script there to use the above commands.

Linting and basic checks
While in the Nix dev shell you can run:

   pylint backend

# or simple style checks
   python -m pip install -U pip
# (if you need additional local installs; prefer the provided dev shell packages)

Developing (edit / run cycle)
1. Enter the dev shell with nix develop.
2. Make code changes in backend/.
3. Run the backend with uvicorn for API work or python for scripts.
4. Use pylint to catch obvious issues.

Troubleshooting
- If nix develop fails saying flakes aren't enabled, enable flakes as shown above.
- If python resolves to a different version outside the shell, ensure you're inside the nix develop shell (the shell prints the Python version on start).
- If uvicorn can't be found inside the shell, confirm the dev shell finished loading and that python --version shows 3.12; the flake defines uvicorn in the Python environment.

Contributing guidelines
- Keep changes small and focused; make feature branches from main.
- Open a PR describing the change and how to test it.
- If you add dependencies, prefer adding them to flake.nix's pyPkgs so the dev shell remains reproducible.

Getting help
Open an issue or reach out in the project channels with the steps you followed, the OS you're using, and any error output.

---

If you'd like, I can also add a sample backend/main.py example (FastAPI hello world) and a minimal requirements-style file — tell me which you'd prefer and I can add it next.
