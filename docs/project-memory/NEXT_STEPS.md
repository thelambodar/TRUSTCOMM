# Next Steps & Engineering Roadmap: SOA IDEATHON 2026 – Problem Statement S26

This document defines the prioritized engineering tasks for continuing work on this repository.

---

## 1. Immediate Action (Bug Fix & Verification)
- **Fix BUG-001**: Update `backend/src/database/db.ts:78` to correctly reference static `NodeCryptoKMSProvider.privateKeyVault` so seeded `rec-fema-001` verifies with `AUTHENTIC`.

---

## 2. Phase 2 & 3: Real Firebase Persistence & Authentication
- **Firestore & Storage Persistence**: Add `FirestoreDBDriver` and file-backed persistence driver so data survives restarts.
- **Firebase Auth ID-Token Validation**: Implement strict ID token validation middleware in `server.ts` and `authService.ts`.

---

## 3. Phase 5: Google Cloud KMS Provider
- Implement `GoogleCloudKMSProvider` implementing `IKMSProvider` using `@google-cloud/kms` with fallback to `NodeCryptoKMSProvider`.

---

## 4. Phase 7 & 8: AI Manipulation Service & Blockchain Provenance
- **Python/FastAPI AI Service**: Deploy local media analysis microservice (`ai-service/app.py`) via `uv`.
- **Blockchain Provenance**: Solidity smart contract (`contracts/ProvenanceRegistry.sol`) + cryptographically chained audit merkle ledger.

---

## 5. Phase 10 & 11: Automated Test Suite & Hardening
- Implement Vitest automated unit, integration, and security tests (`backend/tests/`).
