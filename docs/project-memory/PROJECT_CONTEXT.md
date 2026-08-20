# Project Context: SOA IDEATHON 2026 – Problem Statement S26

## 1. Official Project Identity
- **Project Topic**: Deepfake-Resistant Provenance and Verification System for Official Digital Communications
- **Competition / Platform**: SOA IDEATHON 2026 / Smart India Hackathon (SIH)
- **Problem Statement ID**: S26
- **Category**: Software
- **Domain**: Blockchain & Cybersecurity
- **Project Codename / Brand**: TRUSTCOMM / AURA-TRUST (Media Authenticity Verification Platform)

---

## 2. Official S26 Requirements & Scope
The system must:
1. **Cryptographically sign** authorized institutional audio, video, broadcast notices, and emergency advisories.
2. **Provide a simple, zero-trust verification interface** for public citizens and recipients.
3. **Detect likely manipulation** and provide secondary AI-assisted risk signals.
4. **Distinguish clearly** between unsigned content, authentic content, and proven-fake / tampered / revoked content.
5. **Preserve privacy** for sensitive institutional data using salted hash commitments and off-chain media storage.
6. **Support instantaneous credential revocation** when a signing private key or HSM is compromised.

---

## 3. Technology Stack Breakdown (Verified from Codebase)

### Frontend Layer
- **Modern Interactive WebApp**: React 19 (`react@^19.0.1`, `react-dom@^19.0.1`), TypeScript 5.8, Vite 6 (`vite@^6.2.3`), TailwindCSS 4 (`@tailwindcss/vite`, `tailwindcss@^4.1.14`), Lucide React (`lucide-react@^0.546.0`), Motion (`motion@^12.23.24`).
- **Standalone Static Client (`frontend/standalone-client/`)**: Vanilla HTML5, CSS3 Glassmorphism, ES Modules, Native W3C WebCrypto API (`ECDSA P-256`, `SHA-256`), Web Audio API (FFT frequency spectrum), HTML5 Canvas (facial anomaly heatmap overlay).

### Backend & API Layer
- **Application Server**: Express 4 (`express@^4.21.2`), TypeScript Execution (`tsx@^4.21.0`), Multer (`multer@^2.2.0` in-memory multipart parser), Node.js native `crypto` module.
- **Server Bundling**: ESBuild (`esbuild@^0.25.0`), Node.js CommonJS/ESM hybrid compatibility.

### Firebase Cloud Functions Layer
- **Functions Framework**: Firebase Functions 5.0 (`firebase-functions@^5.0.0`), Firebase Admin SDK 12.0 (`firebase-admin@^12.0.0`).
- **Callable Cloud Functions**:
  - `uploadMedia`: Handles institutional media upload, calculates SHA-256 hash, stores in Cloud Storage bucket (`media/institutions/{institutionId}/`), persists manifest in Firestore `mediaRecords`.
  - `signMedia`: Authenticates institutional issuer, validates active credential, signs SHA-256 hash using KMS abstraction, updates `mediaRecords.status = 'SIGNED'`.
  - `verifyMedia`: Public zero-trust endpoint querying `mediaRecords`, evaluating signature against SPKI public key, verifying revocation status, and generating immutable `verificationLogs`.
  - `revokeCredential`: SYSTEM_ADMIN restricted endpoint setting credential status to `REVOKED` with timestamp and reason.

### Cryptography, KMS & Security
- **Hashing**: SHA-256 (64-character hexadecimal digest of binary media payload).
- **Digital Signatures**: RSA-PSS (2048-bit with SHA-256) and ECDSA (NIST P-256 with SHA-256).
- **Key Management Service (KMS)**: `NodeCryptoKMSProvider` implementing `IKMSProvider` interface (abstracted for seamless Google Cloud KMS HSM asymmetric signing integration; private keys isolated in backend vault and never exposed to clients or Firestore).
- **Privacy Redaction**: Salted SHA-256 zero-knowledge commitments (`SHA256(field:salt)`).
- **Security Rules**: Role-Based & Attribute-Based Access Control (ABAC) in `firestore.rules` and `storage.rules`.

### AI & Blockchain Extensions
- **Deepfake AI Hook**: `CloudRunDeepfakeDetectorStub` implementing `IDeepfakeDetectorProvider` (prepared for Python/PyTorch Cloud Run inference).
- **Blockchain Provenance Hook**: `BlockchainProvenanceStub` implementing `IBlockchainProvenanceProvider` (prepared for Ethereum/Polygon L2 smart contract anchoring) + local permissioned audit block ledger simulator.

---

## 4. Current Status & Feature Matrix

| Functional Capability | Component / File | Status | Detail |
| :--- | :--- | :--- | :--- |
| **Public Media Verification** | `PublicVerification.tsx`, `verifyMediaHandler` | **IMPLEMENTED** | Validates SHA-256 hash, verifies digital signature, returns `AUTHENTIC`, `UNSIGNED`, or `PROVEN_FAKE`. |
| **Institutional Media Upload** | `InstitutionalPortal.tsx`, `uploadMediaHandler` | **IMPLEMENTED** | Multipart file upload, SHA-256 calculation, Cloud Storage path routing, manifest creation. |
| **Cryptographic Media Signing** | `InstitutionalPortal.tsx`, `signMediaHandler` | **IMPLEMENTED** | Validates institution ownership & active credential, signs via KMS provider. |
| **Credential Revocation** | `AdminConsole.tsx`, `revokeCredentialHandler` | **IMPLEMENTED** | System Admin revocation with mandatory reason, nullifying future verifications. |
| **Institutional Management** | `AdminConsole.tsx`, `server.ts` | **IMPLEMENTED** | Institution registration and automatic credential issuance. |
| **Verification Audit Logging** | `db.ts`, `verificationLogs` | **IMPLEMENTED** | Every verification request generates an immutable audit record. |
| **Google Cloud KMS** | `kmsProvider.ts` (`NodeCryptoKMSProvider`) | **MOCKED / EMULATED** | Full crypto signing/verification active using in-memory secure vault; GCP KMS interface ready. |
| **Deepfake AI Inference** | `modularProviders.ts` | **MOCKED / STUBBED** | Returns static anomaly score (0.02); frontend provides Canvas simulation. |
| **Blockchain Smart Contract** | `modularProviders.ts`, `blockchain.js` | **MOCKED / STUBBED** | Returns simulated transaction hash (`0x...`); off-chain logging modeled. |
| **Automated Unit Tests** | `backend/tests/` | **NOT IMPLEMENTED** | Test framework not yet configured in repository. |

---

## 5. Security & Boundary Rules
- **No Secrets in Repository**: No private keys, service account credentials, API tokens, or passwords may be committed.
- **Zero Client Key Exposure**: Private keys must never be returned in API responses or rendered in frontend views. Public keys are provided exclusively in SPKI PEM / JWK format for mathematical signature verification.
- **Role Hierarchy**:
  1. `SYSTEM_ADMIN`: Platform governance, institution onboarding, credential issuance, and credential revocation.
  2. `INSTITUTIONAL_ISSUER`: Uploading and signing media strictly within their authorized `institutionId`.
  3. `PUBLIC_RECIPIENT`: Unauthenticated public access for verifying media authenticity without write permissions.
