# Implementation Plan: S26 Codebase Audit, Project Memory Initialization & Safe Reorganization

Audit, document, and safely organize the existing codebase for **SOA IDEATHON 2026 – Problem Statement S26: "Deepfake-Resistant Provenance and Verification System for Official Digital Communications"**.

---

## User Review Required

> [!IMPORTANT]
> **Strict Adherence to Absolute Restrictions**:
> - NO new product features will be added.
> - NO UI redesign or styling changes.
> - NO alterations to business logic, cryptographic algorithms, API contracts, or mock behaviors.
> - ONLY structural directory reorganization, path/import alignment, and project-memory documentation generation will be performed.

> [!NOTE]
> **Environment Note**: The host machine currently lacks `node`/`npm` in its active Windows system `PATH`. All code integrity, TypeScript syntax, module imports, and configuration links will be audited and verified statically, and exact instructions for running the application in any Node.js environment will be documented in project memory.

---

## Audit Findings Summary (Phases 1–20)

### 1. Technology Stack Audit
- **Primary Full-Stack Web App**: React 19, TypeScript 5.8, Vite 6, TailwindCSS 4, Lucide React, Motion, Express 4, Multer.
- **Secondary Static Web App (`FRONTEND/`)**: Vanilla HTML5, CSS3 (Glassmorphism), ES Modules, WebCrypto API (`ECDSA P-256`, `SHA-256`), Web Audio API, Canvas API.
- **Cloud Functions / Backend (`functions/`)**: Firebase Functions 5.0, Firebase Admin 12.0 (`uploadMedia`, `signMedia`, `verifyMedia`, `revokeCredential`).
- **Data & Storage**: In-memory database abstraction (`InMemoryDB` in `src/backend/db.ts`) adhering to `firebase-blueprint.json` schema (`institutions`, `credentials`, `mediaRecords`, `verificationLogs`, `storageFiles`).
- **Cryptography & KMS**: Node.js `crypto` (`RSA-PSS-SHA256`, `ECDSA-P256-SHA256`, `SHA-256`) wrapped in `NodeCryptoKMSProvider` (`IKMSProvider` abstraction) with in-memory private key enclave.
- **AI & Blockchain**: Modular stubs (`CloudRunDeepfakeDetectorStub` for PyTorch/Cloud Run and `BlockchainProvenanceStub` for Ethereum/Polygon L2).

### 2. Architecture & Co-location Analysis
- Frontend and backend code are currently co-located at the project root:
  - Express server (`server.ts`) sits in the project root and imports directly from `src/backend/db.ts` and `functions/src/index.ts`.
  - Vite dev server is attached as middleware to Express in `server.ts`.
  - React components reside in `src/components/` and `src/App.tsx`.
  - Firebase Cloud Functions source code is located in `functions/src/`.
  - A separate standalone frontend demo exists in `FRONTEND/`.

### 3. Classification of Existing Features & Security States
| Feature Area | Component | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **Public Verification** | `PublicVerification.tsx`, `verifyMedia` | **IMPLEMENTED** | Validates SHA-256 hash, verifies RSA/ECDSA signature against public key, checks credential active/revoked status, returns `AUTHENTIC`, `UNSIGNED`, `PROVEN_FAKE`. |
| **Institutional Portal** | `InstitutionalPortal.tsx`, `uploadMedia`, `signMedia` | **IMPLEMENTED** | File upload, SHA-256 hash calculation, KMS digital signature generation and Firestore manifest storage. |
| **System Admin Console** | `AdminConsole.tsx`, `revokeCredential`, institution creation | **IMPLEMENTED** | Institution registration, cryptographic key generation, and immediate credential revocation with reason logging. |
| **KMS Provider** | `kmsProvider.ts` | **MOCKED / EMULATED** | Emulates hardware security module using in-memory private key vault; provides real cryptographic signing and verification. |
| **Deepfake AI Analysis** | `modularProviders.ts` (`CloudRunDeepfakeDetectorStub`) | **MOCKED / STUBBED** | Modular interface ready; returns mock score (0.02). |
| **Blockchain Provenance** | `modularProviders.ts` (`BlockchainProvenanceStub`) | **MOCKED / STUBBED** | Modular interface ready; returns mock transaction hash (`0x...`). |
| **Access Control (ABAC)** | `authService.ts`, `server.ts` | **IMPLEMENTED** | Role assertion (`INSTITUTIONAL_ISSUER`, `PUBLIC_RECIPIENT`, `SYSTEM_ADMIN`) and institutional ownership checks via request headers. |

---

## Proposed Changes

### Phase 21: Project Memory Initialization (`docs/project-memory/`)

We will create the complete persistent project memory directory containing 7 foundational documents:

#### [NEW] [PROJECT_CONTEXT.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/PROJECT_CONTEXT.md)
Contains S26 project identity, problem statement, official requirements, technology stack breakdown, high-level architecture, implemented vs. stubbed components, and security boundary guidelines.

#### [NEW] [CURRENT_CHECKPOINT.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/CURRENT_CHECKPOINT.md)
Answers: WHERE ARE WE?, WHAT WAS DONE?, WHAT WAS VERIFIED?, WHAT FAILED?, WHAT ISSUES REMAIN?, WHAT FILES CHANGED?, WHAT SHOULD THE NEXT AI DO?, WHAT SHOULD THE NEXT AI NOT DO?

#### [NEW] [ARCHITECTURE_STATE.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/ARCHITECTURE_STATE.md)
Comprehensive technical architecture diagrams, component inventory, data flow sequences (Upload -> Sign -> Verify -> Revoke), security rules specification, and interface contracts for KMS, AI, and Blockchain.

#### [NEW] [ISSUES.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/ISSUES.md)
Detailed security and architectural vulnerability inventory with severity ratings (CRITICAL / HIGH / MEDIUM / LOW), file locations, evidence, and recommendations (e.g. client-supplied auth header validation in dev mode, mock AI/blockchain stubs, missing automated unit test suite).

#### [NEW] [DECISIONS.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/DECISIONS.md)
Records structural organization decisions, separation of concerns rationale, zero-touch business logic preservation, and multi-AI cross-account continuity protocols.

#### [NEW] [CHANGELOG.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/CHANGELOG.md)
Chronological log of structural directory creation, file relocations, and path modifications.

#### [NEW] [NEXT_STEPS.md](file:///c:/Users/SUDHINDRA/OneDrive/Desktop/SIH/deepfake-proof-verification/docs/project-memory/NEXT_STEPS.md)
Prioritized backlog of subsequent technical tasks for future AI accounts (e.g., automated test suite creation, real GCP KMS binding, Cloud Run PyTorch service integration, smart contract anchoring).

---

### Phase 22: Safe Structural Reorganization

To establish clean separation of concerns while preserving every line of business logic and functional execution:

```
deepfake-proof-verification/
├── backend/
│   ├── src/
│   │   ├── api/               (server.ts / route handlers)
│   │   ├── auth/              (authService.ts)
│   │   ├── credentials/       (credentialService.ts)
│   │   ├── cryptography/      (kmsProvider.ts)
│   │   ├── database/          (db.ts, InMemoryDB)
│   │   ├── media/             (mediaService.ts)
│   │   ├── verification/      (verificationService.ts, modularProviders.ts)
│   │   ├── types.ts           (Backend data types & interfaces)
│   │   └── index.ts           (Backend / Cloud Functions entry point)
│   ├── package.json           (Functions package configuration)
│   └── tsconfig.json          (Backend TypeScript configuration)
│
├── frontend/
│   ├── public/                (Static assets & icons)
│   ├── src/
│   │   ├── components/        (AdminConsole, ArchitectureViewer, InstitutionalPortal, Navbar, PublicVerification)
│   │   ├── types.ts           (Frontend shared types)
│   │   ├── App.tsx            (Main application container)
│   │   ├── main.tsx           (DOM entry point)
│   │   └── index.css          (Tailwind stylesheet)
│   ├── standalone-client/     (Relocated static HTML/JS demo from FRONTEND/)
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── README.md
│   │   ├── DOCUMENTATION.md
│   │   └── js/
│   └── index.html             (Vite SPA HTML entry point)
│
├── docs/
│   ├── architecture/          (System diagrams and specifications)
│   ├── api/                   (API endpoint contracts)
│   ├── security/              (Firestore & Storage security rules documentation)
│   └── project-memory/        (7 persistent memory files for AI continuity)
│
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase-blueprint.json
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

#### Detailed Reorganization Actions:
1. **Create directories**:
   - `docs/project-memory/`
   - `backend/src/api/`, `backend/src/auth/`, `backend/src/credentials/`, `backend/src/cryptography/`, `backend/src/database/`, `backend/src/media/`, `backend/src/verification/`
   - `frontend/src/components/`, `frontend/standalone-client/`
2. **Relocate Backend Components**:
   - `functions/src/auth/authService.ts` -> `backend/src/auth/authService.ts`
   - `functions/src/credentials/credentialService.ts` -> `backend/src/credentials/credentialService.ts`
   - `functions/src/media/kmsProvider.ts` -> `backend/src/cryptography/kmsProvider.ts`
   - `functions/src/media/mediaService.ts` -> `backend/src/media/mediaService.ts`
   - `functions/src/verification/modularProviders.ts` -> `backend/src/verification/modularProviders.ts`
   - `functions/src/verification/verificationService.ts` -> `backend/src/verification/verificationService.ts`
   - `functions/src/types.ts` -> `backend/src/types.ts`
   - `functions/src/index.ts` -> `backend/src/index.ts`
   - `src/backend/db.ts` -> `backend/src/database/db.ts`
   - `server.ts` -> `backend/src/api/server.ts` (with root entry proxy or updated package.json scripts)
3. **Relocate Frontend Components**:
   - `src/components/*` -> `frontend/src/components/*`
   - `src/App.tsx` -> `frontend/src/App.tsx`
   - `src/main.tsx` -> `frontend/src/main.tsx`
   - `src/index.css` -> `frontend/src/index.css`
   - `src/types.ts` -> `frontend/src/types.ts`
   - `FRONTEND/*` -> `frontend/standalone-client/*`
4. **Update Configuration & Scripts**:
   - Update `vite.config.ts`, `tsconfig.json`, and `package.json` to reference the organized paths seamlessly.
   - Adjust relative import paths in relocated files to maintain exact TypeScript and JavaScript resolution.

---

## Verification Plan

### Automated / Code Quality Verification
- Verify all relocated file paths and TypeScript imports match.
- Verify `package.json` build/dev scripts correctly resolve `backend/src/api/server.ts` and `frontend/`.
- Validate that all cryptographic operations, ABAC checks, and API routes in `backend/` retain identical signatures and logic.

### Manual / Structural Inspection
- Inspect `docs/project-memory/` files for completeness, factual accuracy, and absence of any secrets or credentials.
- Verify that both the React SPA and the standalone static client are preserved without loss of assets or documentation.
- Update `walkthrough.md` with full audit results, directory map, and post-reorganization verification status.
