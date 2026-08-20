# Architectural & Design Decisions: SOA IDEATHON 2026 – Problem Statement S26

## 1. Decision Log

### DEC-001: Separation of Frontend and Backend Layers
- **Date**: 2026-08-19
- **Decision**: Reorganize the repository from root co-location into clean `frontend/`, `backend/`, `docs/`, and `scripts/` directories while maintaining a unified root development workflow.
- **Rationale**: The previous structure placed `server.ts` and `src/backend/db.ts` alongside React components in `src/`, causing ambiguity between client and server code boundaries.
- **Alternatives Considered**: Keeping a single monolithic `src/` folder (rejected due to difficulty in maintaining separate frontend/backend deployments for Firebase Functions / Cloud Run).

### DEC-002: Dual Client Support (React SPA + Standalone Static Demo)
- **Date**: 2026-08-19
- **Decision**: Maintain both the modern React 19 SPA (`frontend/src/`) and the standalone static client (`frontend/standalone-client/`) in the repository.
- **Rationale**: The React SPA provides full full-stack interaction with the Express backend, KMS provider, and Cloud Functions. The standalone static client provides an offline, zero-dependency HTML5/WebCrypto demo for immediate hackathon demonstration without running Node servers.
- **Alternatives Considered**: Deleting `FRONTEND/` (rejected to prevent any loss of existing assets, forensic canvas scripts, or documentation).

### DEC-003: Cryptography-First Tri-State Verification Architecture
- **Date**: 2026-08-19
- **Decision**: Prioritize deterministic cryptographic provenance (`ECDSA P-256` / `RSA-PSS` + `SHA-256`) as the primary authority, treating deepfake AI detection as a secondary risk indicator.
- **Rationale**: S26 problem framing mandates that AI detection alone cannot establish provenance, institutional identity, or credential validity. Cryptographic digital signatures signed by verified institutions provide mathematically indisputable proof of origin and integrity.
- **Verification States Established**:
  1. `AUTHENTIC`: Cryptographically signed, unrevoked key, matching SHA-256 digest.
  2. `UNSIGNED`: Content lacks valid institutional cryptographic registration.
  3. `PROVEN_FAKE`: Content signature tampered, binary altered, or signing key revoked.

### DEC-004: In-Memory Key Enclave with Zero Client Exposure
- **Date**: 2026-08-19
- **Decision**: Implement `NodeCryptoKMSProvider` to keep private keys isolated in a private backend Map, exposing only public SPKI keys and signature verification APIs.
- **Rationale**: Prevents accidental leakage of private keys to frontend JavaScript bundles or public API responses, satisfying core cybersecurity requirements.

### DEC-005: Persistent Repository Project Memory (`docs/project-memory/`)
- **Date**: 2026-08-19
- **Decision**: Store all project context, architecture state, issues, decisions, and next steps in standard Markdown files within the repository.
- **Rationale**: Eliminates dependence on hidden AI account memory, conversation state, or chat logs, allowing any AI or human engineer to resume work seamlessly.
