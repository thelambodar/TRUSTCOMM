# Issues & Vulnerabilities Log: SOA IDEATHON 2026 – Problem Statement S26

## 1. Security & Architectural Issues Matrix

| Issue ID | Severity | File / Component | Evidence | Status | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | **HIGH** | `backend/src/database/db.ts:78` | `associateKey` static mapping resolved key vault binding, allowing seeded active credential key matching on verification. | **RESOLVED** | Verified: FEMA sample verifies as `AUTHENTIC`. |
| **SEC-001** | **MEDIUM** | `backend/src/api/server.ts:30-42` | `extractAuthContext` trusts client-supplied headers (`x-user-role`, `x-institution-id`) in local development mode. | **ACTIVE (Dev Mode)** | Replace header extraction with Firebase ID Token validation (`admin.auth().verifyIdToken(token)`). |
| **SEC-002** | **LOW** | `backend/src/database/db.ts:15-32` | `InMemoryDB` stores state in Node.js process RAM. State is reset upon server restart. | **ACTIVE (Local Prototype)** | Connect `db.ts` to live Cloud Firestore using Firebase Admin SDK / file-backed persistent snapshot driver. |
| **SEC-003** | **LOW** | `backend/src/verification/modularProviders.ts:22-32` | `CloudRunDeepfakeDetectorStub` returns static mock score (0.02) without running actual model inference. | **INTENDED STUB** | Deploy PyTorch/FastAPI media analysis microservice and invoke via HTTP in `IDeepfakeDetectorProvider`. |
| **SEC-004** | **LOW** | `backend/src/verification/modularProviders.ts:52-65` | `BlockchainProvenanceStub` returns simulated transaction hash (`0x...`). | **INTENDED STUB** | Deploy Solidity/Polygon provenance anchor contract and integrate RPC calls / cryptographically chained audit merkle ledger. |
| **SEC-005** | **LOW** | `backend/tests/` | Automated unit or integration test suite is not yet configured with vitest runner. | **OPEN** | Add Vitest test suites under `backend/tests/` verifying all tri-state outcomes (`AUTHENTIC`, `UNSIGNED`, `PROVEN_FAKE`). |

---

## 2. Detailed Issue Reports

### BUG-001: Key Vault Instance vs Static Property Mismatch on Seed
- **Description**: In `db.ts`, `credPair1` generates a private key stored in `NodeCryptoKMSProvider.privateKeyVault` (static). The registration code called `(kmsProvider as any).privateKeyVault?.get(credPair1.privateKeyId)`, which returned `undefined`. As a result, `signHash` generated a second separate private key, causing signature verification against `cred1.publicKey` to fail on the seeded FEMA sample.
- **Remediation**: Call `NodeCryptoKMSProvider.registerKey(cred1.id, (NodeCryptoKMSProvider as any).privateKeyVault.get(credPair1.privateKeyId))`.

### SEC-001: Client-Supplied Header Role Trust (Dev Mode)
- **Description**: The Express server inspects `req.headers['x-user-role']` and `req.headers['x-institution-id']` to populate the `AuthContext` for RBAC evaluation.
- **Remediation**: In production mode, require valid Firebase ID tokens passed in `Authorization: Bearer <token>`.
