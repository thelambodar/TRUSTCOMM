# 🛡️ TRUSTCOMM — Deepfake-Resistant Provenance & Verification System

> **SOAIDEATHON-S26 / Smart India Hackathon Project Research & Implementation**  
> *Focus: Cybersecurity + AI + Digital Provenance + Blockchain + Emergency Communication*

---

## 🛡️ Executive Summary

**TRUSTCOMM** is a privacy-preserving digital communication trust platform designed for authorized government and public institutions. It cryptographically binds official video broadcasts, emergency audio advisories, notices, and documents to verified institutional identities while detecting AI-generated deepfakes, tracking notice version updates, and supporting instant signer credential revocation.

Rather than relying solely on post-distribution deepfake detection, **TRUSTCOMM** establishes authenticity at the source using **C2PA (Content Credentials)** standards, while using AI manipulation detection as a secondary risk signal.

---

## 🌟 Key Features

### 1. 🔍 Tri-State & 6 Extended Verdict Outcomes
Accurately classifies communications into 6 transparent security states:
- 🟢 **VERIFIED AUTHENTIC & CURRENT**: Cryptographically signed by an authorized institution, unrevoked key, matching SHA-256 content digest, latest version.
- 🟡 **AUTHENTIC BUT OUTDATED (SUPERSEDED)**: Genuinely signed notice, but superseded by a newer official update (e.g., Version 1 notice superseded by Version 2).
- 🔴 **TAMPERED CONTENT**: Manifest altered, broken digital signature, or media payload digest mismatch.
- 🔴 **CREDENTIAL REVOKED**: Signed by a key flagged on the real-time Key Revocation Ledger due to HSM breach or compromise.
- 🔴 **SUSPICIOUS / AI DEEPFAKE**: Unsigned content exhibiting high temporal/spectral manipulation anomalies (>75%).
- 🟡 **UNSIGNED CONTENT**: Lacks embedded C2PA provenance manifest.

### 2. 📊 Explainable Trust Decision Score (0–100%)
Unifies 6 independent security signals into an explainable score with progress breakdown bars:
1. **Cryptographic Signature** (30 pts) — ECDSA P-256 / RSA-PSS P-256 curve validity.
2. **Institutional Authority Anchor** (20 pts) — X.509 certificate & domain anchor check.
3. **SHA-256 Digest Integrity** (20 pts) — Media payload tamper check.
4. **Signer Credential Active** (10 pts) — Unrevoked key status check.
5. **Notice Version Currency** (10 pts) — Current version vs superseded notice status.
6. **AI Anomaly Inspection** (10 pts) — Secondary audio/video deepfake risk penalty.

### 3. ✍️ Official Signing Studio & Emergency Broadcast Mode
- **Officer Role Login**: Authorized signing profiles (Disaster Operations Director, Chief Financial Press Attaché, Press Secretary to the Mayor).
- **Emergency Settings**: Priority Level (`CRITICAL`, `HIGH`, `NORMAL`), Geographic Scope (`Coastal Sector 4 & 5`), and Validity Period dates.
- **Notice Versioning**: Publish initial Version 1 or Version 2 superseding previous notice IDs.
- **Zero-Knowledge Privacy Redaction**: Salted hash commitments for sensitive fields (e.g. responder GPS coordinates).

### 4. 📲 Citizen Verification Inspector
- **Dual Input Modes**: Drag & Drop file uploader OR SHA-256 hash search.
- **Explainable Trust Score**: Real-time breakdown of cryptographic validity, institutional authority, and deepfake anomaly risk.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React | High-tech cyber verification interface & responsive SPA |
| **Backend API** | Node.js, Express 4, Vite 6 Middleware | Cloud Functions gateway & API ingress |
| **Cryptography** | Native WebCrypto API & Node.js Crypto | KMS key enclave (RSA-PSS / ECDSA), SHA-256 & digital signatures |
| **AI Detector** | Modular Provider Interface + Google GenAI (`@google/genai`) | AI deepfake anomaly scoring & spectral manipulation check |
| **Blockchain Ledger** | Modular Permissioned Ledger Stub | Immutable off-chain transaction logging (`0x...`) |

---

## 🚀 How to Run Locally

### Prerequisites
* **Node.js**: v18+ (v22 recommended)
* **npm** or **bun**

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
This launches the integrated Express API + Vite SPA server on:
👉 **`http://localhost:3000`**

### 3. API Health Check
Visit `http://localhost:3000/api/health` to verify active Cloud Functions and modular provider hooks.

### 4. Build for Production
```bash
npm run build
```

---

## 📚 Sub-Module Documentation

* **[`backend/README.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/backend/README.md)** — Backend API endpoints, Cloud Functions, and KMS cryptographic key vault documentation.
* **[`frontend/README.md`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/frontend/README.md)** — React SPA UI components, portals, and state hooks documentation.

---

## 📄 License
This project is developed for research & demonstration purposes under the Smart India Hackathon (SIH) framework.
