# API Reference: SOA IDEATHON 2026 – Problem Statement S26

Backend server base URL: `http://localhost:3000`

---

## 1. System & Health Endpoints

### `GET /api/health`
Returns backend operational status, active Cloud Functions, and modular provider integration status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Media Authenticity Verification Platform Backend",
  "timestamp": "2026-08-19T02:00:00.000Z",
  "firebaseCloudFunctions": ["uploadMedia", "signMedia", "verifyMedia", "revokeCredential"],
  "modularProviders": {
    "kms": "NodeCryptoKMSProvider (Google Cloud KMS Interface Ready)",
    "deepfakeAi": "CloudRunDeepfakeDetectorStub (PyTorch / Cloud Run Interface Ready)",
    "blockchain": "BlockchainProvenanceStub (Ethereum/Polygon Anchor Interface Ready)"
  }
}
```

---

## 2. Institutional Media Management

### `POST /api/media/upload`
Uploads official media binary to Cloud Storage, computes SHA-256 hash, and creates an unsigned manifest in Firestore `mediaRecords`.

- **Headers**:
  - `x-user-role`: `INSTITUTIONAL_ISSUER` | `SYSTEM_ADMIN`
  - `x-institution-id`: `{institutionId}`
- **Body (`multipart/form-data`)**:
  - `file`: Media binary file (max 100MB; audio, video, PDF, text)
  - `institutionId`: Target institution identifier (e.g. `inst-fema`)
  - `mediaType`: `'AUDIO' | 'VIDEO' | 'NOTICE' | 'EMERGENCY'`
  - `title`: (optional) Human-readable title
  - `credentialId`: (optional) Designated credential ID

**Response (201 Created):**
```json
{
  "id": "rec-1724032800000",
  "institutionId": "inst-fema",
  "credentialId": "cred-fema-primary",
  "mediaHash": "8f3b2075790c...9a0c",
  "mediaType": "EMERGENCY",
  "signature": null,
  "storagePath": "media/institutions/inst-fema/1724032800000-advisory.pdf",
  "blockchainTxHash": null,
  "status": "PENDING_SIGNATURE",
  "createdAt": "2026-08-19T02:00:00.000Z",
  "signedAt": null,
  "originalFileName": "advisory.pdf",
  "fileSizeBytes": 1048576,
  "mimeType": "application/pdf",
  "title": "Severe Weather Evacuation Advisory"
}
```

---

### `POST /api/media/sign`
Generates a cryptographic signature for an uploaded media manifest using the institution's active KMS credential.

- **Headers**:
  - `x-user-role`: `INSTITUTIONAL_ISSUER` | `SYSTEM_ADMIN`
  - `x-institution-id`: `{institutionId}`
- **Body (`application/json`)**:
  ```json
  {
    "mediaRecordId": "rec-1724032800000",
    "credentialId": "cred-fema-primary",
    "institutionId": "inst-fema"
  }
  ```

**Response (200 OK):**
```json
{
  "success": true,
  "signature": "MEYCIQDpZ1N9...==",
  "mediaHash": "8f3b2075790c...9a0c",
  "status": "SIGNED",
  "timestamp": "2026-08-19T02:05:00.000Z",
  "credentialId": "cred-fema-primary",
  "institutionId": "inst-fema",
  "keyAlgorithm": "RSA-PSS-SHA256"
}
```

---

## 3. Zero-Trust Public Verification

### `POST /api/media/verify`
Public endpoint allowing any citizen or service to verify media authenticity by hash or direct file upload.

- **Authentication**: None required (`PUBLIC_RECIPIENT`).
- **Body (`application/json` OR `multipart/form-data`)**:
  - Option A: `{ "mediaHash": "8f3b2075790c...9a0c" }`
  - Option B: Multipart file attachment

**Response (200 OK - Authentic Scenario):**
```json
{
  "verdict": "AUTHENTIC",
  "mediaHash": "8f3b2075790c...9a0c",
  "isSigned": true,
  "tamperDetected": false,
  "issuerId": "inst-fema",
  "institutionName": "Federal Emergency Management Agency (FEMA)",
  "credentialStatus": "ACTIVE",
  "deepfakeScore": 0.02,
  "checkedAt": "2026-08-19T02:10:00.000Z",
  "details": "Cryptographically verified official media issued by Federal Emergency Management Agency (FEMA). Digital signature is intact and valid.",
  "logId": "log-1724032800000-abc1",
  "mediaRecord": { ... }
}
```

**Response (200 OK - Revocation / Proven Fake Scenario):**
```json
{
  "verdict": "PROVEN_FAKE",
  "mediaHash": "8f3b2075790c...9a0c",
  "isSigned": true,
  "tamperDetected": true,
  "issuerId": "inst-fema",
  "institutionName": "Federal Emergency Management Agency (FEMA)",
  "credentialStatus": "REVOKED",
  "deepfakeScore": null,
  "checkedAt": "2026-08-19T02:10:00.000Z",
  "details": "Revocation alert: Issuer credential has been REVOKED (Private key compromise). Media authenticity is nullified.",
  "logId": "log-1724032800000-xyz9"
}
```

---

## 4. Administrative & Credential Management

### `POST /api/credentials/revoke`
Revokes an institutional credential immediately, neutralizing all associated signatures.

- **Headers**:
  - `x-user-role`: `SYSTEM_ADMIN`
- **Body (`application/json`)**:
  ```json
  {
    "credentialId": "cred-fema-compromised-2024",
    "revocationReason": "Suspected private key exposure during security perimeter audit (CVE-2026-0812)"
  }
  ```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credential 'cred-fema-compromised-2024' has been revoked successfully.",
  "credential": {
    "id": "cred-fema-compromised-2024",
    "status": "REVOKED",
    "revokedAt": "2026-08-19T02:15:00.000Z",
    "revocationReason": "Suspected private key exposure during security perimeter audit (CVE-2026-0812)"
  }
}
```
