# 🛠️ Contributing to K1 Platform

Welcome to the engine room! This document covers how to set up your environment for **K1 Platform**. We use **Nix** for a reproducible shell and **Docker** for the heavy-duty Denodo infrastructure.

---

## 1. Prerequisites 📋

Before you begin, make sure you have these tools installed:

* **Docker & Docker Compose**: To run Denodo VDP, AI-SDK, and Grafana.
  👉 [Install Docker (Convenience Script)](https://github.com/docker/docker-install)
* **Git**: To manage versions and submodules.
* **Nix**: The backbone of our development environment.
  ❄️ [Download Nix](https://nixos.org/download/)
* **direnv** (Highly Recommended): For seamless Nix integration.
  🚀 [Install direnv](https://direnv.net/) & [nix-direnv](https://github.com/nix-community/nix-direnv)

---

## 2. Setting Up Nix & Environment ❄️

We use **Nix Flakes** to ensure every dev has the exact same NodeJS and FastAPI versions.


### A. Enable Nix Flakes

Flakes are a must. Add the experimental features to your config:

```bash
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### B. Direnv Integration (The "Magic" Way)

To automatically load the environment when you `cd` into the folder:

---

## 3. Launching the Platform 🚀

### Step 1: Data Layer (Docker)

Ensure your `denodo.lic` is in `./config/`. Then, fire up the containers:

```bash
docker-compose up -d
```

This handles VDP and AI-SDK.

### Step 2: Development Shell

If you don't use direnv, enter the shell manually:

```bash
nix develop
```

### Step 3: Backend (FastAPI)

Inside the Nix shell:

```bash
cd backend
fastapi run
```

### Step 4: Frontend (React 19)

In another terminal (inside `nix develop`):

```bash
cd frontend
npm install
npm run dev
```

---


## 🔗 Useful Docs

- 📑 [Denodo VDP Admin Guide](#)  
- 🚀 [FastAPI Official Docs](https://fastapi.tiangolo.com/)  
- ⚛️ [React 19 / Vite Docs](https://vitejs.dev/)  
- ❄️ [Zero to Nix](https://nixos.org/manual/nix/stable/)

<p align="center">
    <strong>HackUDC 2026 - No sleep, just code.</strong> 🦁
</p>
