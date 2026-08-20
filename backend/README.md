# ⚙️ TRUSTCOMM — Backend API & Cloud Functions Service

> **Media Authenticity & Provenance Verification Engine**  
> *Node.js / Express / TypeScript / WebCrypto / KMS Enclave Enforcer*

---

## 🛡️ Overview

The **TRUSTCOMM Backend** provides an institutional API gateway and cryptographic verification service. It manages institutional profiles, KMS signing credentials, media payload hash generation (SHA-256), digital signature verification, and audit trail logging.

Designed with a **Cloud Functions architecture**, backend endpoints run as serverless microservices or as an Express server in production.

---

## 🌟 Key Responsibilities

1. **🔐 KMS Key Enclave & Signing (`kmsProvider.ts`)**:
   - Manages institutional key pairs (RSA-PSS 2048/4096 & ECDSA P-256).
   - Keeps private keys strictly isolated inside the backend enclave (simulating Google Cloud KMS HSM).
   - Generates digital signatures over media SHA-256 hashes.

2. **📲 Public Verification Pipeline (`verificationService.ts`)**:
   - Accepts media files or SHA-256 hashes from citizen clients.
   - Verifies cryptographic signatures, active credential status, and tamper history.
   - Evaluates AI deepfake risk scores (`deepfakeDetector.analyzeMedia`).
   - Classifies verification outcomes into 6 security states (`AUTHENTIC`, `UNSIGNED`, `PROVEN_FAKE`, etc.).

3. **🏢 Institutional Management & Credential Revocation (`credentialService.ts`)**:
   - System Admin onboarding for official institutions (FEMA, WHO, NOAA).
   - Issuance of active KMS credentials.
   - Real-time credential revocation workflow upon key breach or compromise.

4. **⛓️ Blockchain & AI Microservice Hooks (`modularProviders.ts`)**:
   - Interface for PyTorch / Gemini deepfake detection microservices.
   - Interface for Ethereum / Polygon L2 off-chain media hash anchoring.

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, active Cloud Functions & provider check |
| `GET` | `/api/institutions` | Public | List registered government & public institutions |
| `POST` | `/api/institutions` | System Admin | Register a new institutional authority |
| `GET` | `/api/credentials` | Public | Query active/revoked credentials for an institution |
| `POST` | `/api/credentials` | System Admin | Issue a new KMS key pair for an institution |
| `POST` | `/api/credentials/revoke` | System Admin | Revoke an existing credential |
| `POST` | `/api/media/upload` | Institutional Issuer | Upload media payload, compute SHA-256, store metadata |
| `POST` | `/api/media/sign` | Institutional Issuer | Sign media digest with active KMS credential |
| `POST` | `/api/media/verify` | Public | Verify media authenticity & inspect deepfake score |
| `GET` | `/api/media` | Public | Query registered institutional media records |
| `GET` | `/api/storage/*` | Public | Retrieve media payload files from storage |
| `GET` | `/api/verification-logs` | Public | Query audit verification logs |

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── api/
│   │   └── server.ts              # Express API Server & Vite SPA Middleware
│   ├── auth/
│   │   └── authService.ts         # ABAC Role & Permission Assertion
│   ├── credentials/
│   │   └── credentialService.ts   # Credential Issuance & Revocation
│   ├── cryptography/
│   │   └── kmsProvider.ts         # NodeCrypto KMS Vault & RSA/ECDSA Engine
│   ├── database/
│   │   └── db.ts                  # Persistence Layer & Storage Driver
│   ├── media/
│   │   └── mediaService.ts        # Upload Handler & SHA-256 Digesting
│   ├── verification/
│   │   ├── modularProviders.ts    # PyTorch AI & Blockchain Provider Hooks
│   │   └── verificationService.ts # Public Verification Pipeline
│   ├── index.ts                   # Backend Cloud Functions Entry Point
│   └── types.ts                   # Shared TypeScript Interfaces
├── package.json
└── tsconfig.json
```

---

## 🚀 Running the Backend

### Start Development Server
```bash
npm run dev
# Starts Express API server on http://localhost:3000
```

### Build Production Bundle
```bash
npm run build
# Compiles backend to dist/server.cjs
```
