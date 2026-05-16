# 🧠 SynapseOS Cognitive Tracker

SynapseOS is a next-generation **EdTech platform** designed to solve the "Autonomous Adaptation Deficit" for neurodivergent students (Dyslexia, ADHD, Autism). 

By tracking real-time behavioral and biometric data using **Edge AI** and **Cloud Telemetry**, SynapseOS autonomously simplifies educational content through an LLM intervention *before* the student experiences cognitive overload or frustration.

## 🚀 Core Features

- **👁️ Edge AI Face Tracking (NovaVision Concept):** Uses `face-api.js` to run lightweight, zero-latency facial landmark and movement tracking directly in the browser. 
- **🖱️ Diginova Cloud Telemetry:** Captures precise DOM behavior (scroll jitter, cursor hesitation) to measure physiological stress, securely forwarding JSON payloads to the Cloud via a modern Serverless HTTP architecture.
- **🤖 Puq.ai Autonomous Intervention:** When the calculated cognitive load exceeds the critical threshold (75%), an automated webhook fires to Puq.ai, which instantly returns a dynamically simplified, dyslexia-friendly version of the reading material.
- **📊 Serverless Teacher Dashboard:** Real-time monitoring powered by Firebase Firestore, giving educators a live "Cognitive Load Heatmap" and autonomous diagnosis reports for all online students.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, CSS
- **Edge AI Processing:** `face-api.js` (Running Neural Networks natively in the browser)
- **Telemetry & Sync:** Diginova Integration Protocol (REST API / Fetch)
- **Backend & State Management:** Firebase Cloud Firestore (NoSQL, Real-time)
- **Generative AI Workflow:** Puq.ai API

## ⚙️ Installation & Usage

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Berkcanaskin/base41.git
   cd base41
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables (`.env`):**
   ```env
   VITE_PUQAI_API_KEY=your_puqai_key
   VITE_PUQAI_WEBHOOK_URL=your_puqai_url
   VITE_FIREBASE_API_KEY=your_firebase_key
   ...
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🏆 Hackathon Context (EdTech Theme)

This project directly targets the **Accessibility and Operational Bottlenecks in Education**. 

**Architectural Pivot for Performance:** 
Initially designed as a standard Cloud Webhook workflow, we quickly realized that biometric tracking requires zero-latency processing. To ensure real-time otonomous interventions, we pivoted heavy Computer Vision workloads to the **Edge (in-browser)**. The resulting architecture minimizes network overhead while maintaining perfect cloud synchronization via our Diginova telemetry integration.

---
*Built for the Hackathon - Ready for Deployment (Netlify Compatible)*
