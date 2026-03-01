# 🚀 K2 Platform | HackUDC 2026

<p align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon_Project-orange?style=for-the-badge&logo=rocket" alt="Status">
  <img src="https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Data-Denodo_VDP-05192D?style=for-the-badge" alt="Denodo">
</p>

---

## 💡 Overview

**K2 Platform** is an advanced data orchestration and intelligence hub developed for **HackUDC 2026**. It bridges the gap between raw, siloed data and actionable insights by combining **Data Virtualization** with **Generative AI**.

The platform abstracts complex data sources using **Denodo**, processes them via a high-performance **FastAPI** backend, and delivers a sleek, real-time experience through a **React** frontend and **Grafana** dashboard.

## ✨ Key Features

- 🛠️ **Data Virtualization:** Unified access to disparate data sources via Denodo VDP.
- 🤖 **AI-Driven Insights:** Integrated Denodo AI-SDK for natural language data querying.
- 📊 **Live Observability:** Real-time data visualization and system monitoring with Grafana.
- ⚡ **Modern Interface:** High-performance UI built with React and Tailwind CSS.
- ❄️ **Reproducible Dev Environment:** Powered by **Nix** to ensure a consistent, declarative, 
and reliable development setup for the whole team.

---

## 🏗️ Architecture & Stack

### **Frontend**
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS

### **Backend & Data**
- **API:** FastAPI (Python 3.12)
- **Virtualization:** **Denodo VDP** (Virtual Data Port)
- **AI Engine:** **Denodo AI-SDK** (RAG & Chatbot capabilities)
- **Monitoring:** **Grafana** connected to backed database.

---

## 🎬 Use Case Demos

Short video walkthroughs showcasing the main capabilities of **K2 Platform**. All videos are located in the [`docs/`](./docs) folder.

| # | Use Case | Description | Video |
|---|----------|-------------|-------|
| 1 | **Book Recommendation by Category** | The platform recommends books based on user personal preferences and selected category. | [▶️ use_case_1.mp4](./docs/use_case_1.mp4) |
| 2 | **Google OAuth Login** | User signs into the application using Google OAuth authentication. | [▶️ use_case_2.mp4](./docs/use_case_2.mp4) |
| 3 | **Car Selection by Age & Budget** | The system suggests the best car options based on the user's age and available budget. | [▶️ use_case_3.mp4](./docs/use_case_3.mp4) |
| 4 | **Deep Thinking (Iterative Analysis)** | Simulated deep thinking by iterating over the analysis and execution phases (metadata & data) for more refined results. | [▶️ use_case_4.mp4](./docs/use_case_4.mp4) |

---

## 🤝 Contributing

We love hackers! Whether you found a bug, want to add a new Denodo data source, or improve the AI-SDK prompts, your help is welcome.

1.  **Fork** the project.
2.  Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.
   
---

## ⚖️ License & Open Source Philosophy

We believe in the power of shared knowledge. **K2 Platform** is licensed under the **GNU GPLv3**. 

### Why GPLv3?
- **Freedom:** You are free to use, study, share, and modify the software.
- **Copyleft:** This license ensures that **K2 Platform** and any derivative works will **always remain Open Source**.
- **Community First:** We want to prevent "enclosure" of the code. If you improve it, the community benefits.

*Check the LICENSE [GNU GPLv3](./LICENSE) file for more details.*

---

## 🤝 Contributing

We love hackers! This project is a collaborative effort, and we welcome any contribution to make **K2 Platform** even better.

> [!IMPORTANT]
> Before you start coding, please read our **[Installation & Contribution Guide](./CONTRIBUTING.md)** to set up your environment using **Nix** and **Docker**.

1.  **Fork** the project.
2.  **Clone** your fork and enter the environment: `nix-shell`.
3.  Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
4.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
5.  **Push** to the branch (`git push origin feature/AmazingFeature`).
6.  Open a **Pull Request**.

---

## 👥 The Team: InnovateXYZ

Developed with ❤️ and very little sleep at **HackUDC 2026**.

- **[Sergio Goyanes Legazpi]** - [@sergio-legazpi](https://github.com/sergio-legazpi)
- **[Alexandre Borrazás Mancebo]** - [@alexborrazasm](https://github.com/alexborrazasm)
- **[Mario Lamas Angeriz]** - [@Choped7626](https://github.com/Choped7626)
- **[Daniel Garcia Figeroa]** - [@gitdfigueroa](https://github.com/gitdfigueroa)

---

<p align="center">
    <strong>HackUDC 2026 - No sleep, just code.</strong> 🦁
</p>
