# 🎨 TRUSTCOMM — Frontend UI & User Experience Layer

> **Media Authenticity Verification Platform — Client Application**  
> *React 19 / TypeScript / Vite / Tailwind CSS / WebCrypto API*

---

## 🛡️ Overview

The **TRUSTCOMM Frontend** provides a responsive, high-tech glassmorphism web application designed for two primary personas:
1. **Citizens & Public Recipients**: Drag-and-drop media inspector to verify authenticity, check SHA-256 content digests, and review explainable AI deepfake risk scores.
2. **Institutional Issuers & System Admins**: Authorized issuance studio to upload notices, execute KMS cryptographic signatures, issue credentials, and manage key revocation logs.

---

## 🌟 Key Modules & Interactive Portals

### 1. 🔍 Public Verification Inspector ([`PublicVerification.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/frontend/src/components/PublicVerification.tsx))
* **Client-side SHA-256 Digesting**: Uses native browser `window.crypto.subtle.digest('SHA-256', arrayBuffer)` for instant local hash calculation.
* **Explainable Trust Decision Engine**: Renders a 0–100% composite trust score with breakdown bars for cryptographic signature, authority anchor, content integrity, credential status, and AI anomaly inspection.
* **6 Extended Verdict Outcomes**:
  - 🟢 `VERIFIED AUTHENTIC & CURRENT`
  - 🟡 `AUTHENTIC BUT OUTDATED (SUPERSEDED)`
  - 🔴 `TAMPERED CONTENT`
  - 🔴 `CREDENTIAL REVOKED`
  - 🔴 `SUSPICIOUS / AI DEEPFAKE`
  - 🟡 `UNSIGNED CONTENT`

### 2. ✍️ Institutional Issuance Studio ([`InstitutionalPortal.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/frontend/src/components/InstitutionalPortal.tsx))
* **Official Media Upload**: Drag-and-drop interface for uploading notice PDFs, audio advisories, emergency broadcasts, and video clips.
* **KMS Signature Trigger**: Connects to backend KMS hardware enclave simulation to apply RSA-PSS or ECDSA digital signatures to media digests.
* **Key Vault Monitor**: Displays active institutional credentials, key algorithms, and issue timestamps.

### 3. 🔐 System Admin Console ([`AdminConsole.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/frontend/src/components/AdminConsole.tsx))
* **Institutional Onboarding**: Register official government entities (e.g. FEMA, WHO, NOAA).
* **Credential Lifecycle**: Issue new KMS credentials and execute instant real-time key revocations with reason tracking.
* **Audit Trail Log**: Real-time verification query history.

### 4. 📐 System Architecture Inspector ([`ArchitectureViewer.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/deepfake-proof-verification/deepfake-proof-verification/frontend/src/components/ArchitectureViewer.tsx))
* **Cloud Functions Visualizer**: Interactive architectural map of `uploadMedia`, `signMedia`, `verifyMedia`, and `revokeCredential` Cloud Functions.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript 5.8 | Modern component architecture & strict type safety |
| **Build Tool** | Vite 6 | Lightning-fast HMR and ESM bundling |
| **Styling** | Tailwind CSS v4 | High-tech dark cyber glassmorphism design system |
| **Icons** | Lucide React | Modern vector iconography |
| **Cryptography** | WebCrypto API (`crypto.subtle`) | In-browser SHA-256 digesting |

---

## 📁 Component Tree

```
frontend/src/
├── components/
│   ├── AdminConsole.tsx         # System Admin portal (Institutions & Revocation)
│   ├── ArchitectureViewer.tsx   # System Architecture & Cloud Functions inspector
│   ├── InstitutionalPortal.tsx  # Official Media Upload & KMS Signing Studio
│   ├── Navbar.tsx               # Top navigation bar with Role Switcher
│   └── PublicVerification.tsx   # Public media inspector & trust score visualizer
├── App.tsx                      # Main SPA container & global state manager
├── index.css                    # Tailwind CSS imports & global styles
├── main.tsx                     # React 19 root DOM entry point
└── types.ts                     # Shared TypeScript interface definitions
```

---

## 🚀 Development & Build

### Start Development Server
```bash
npm run dev
# Launches Vite dev server integrated with Express API at http://localhost:3000
```

### Production Build
```bash
npm run build
# Compiles optimized client assets to dist/
```
