# 📡 TRUSTCOMM — Backend API Reference & Integration Guide

> **SOA IDEATHON 2026 – Problem Statement S26**  
> *Base Server URL*: `http://localhost:3000`  
> *Specification Version*: `2.4.0`

---

## 📋 Table of Contents
1. [Authentication & ABAC Headers](#1-authentication--abac-headers)
2. [System & Health Endpoints](#2-system--health-endpoints)
3. [Institutional Identity Management](#3-institutional-identity-management)
4. [Credential Lifecycle & Key Revocation](#4-credential-lifecycle--key-revocation)
5. [Media Upload & KMS Hardware Signing](#5-media-upload--kms-hardware-signing)
6. [Public Zero-Trust Verification Engine](#6-public-zero-trust-verification-engine)
7. [Audit Logs & Media Query Endpoints](#7-audit-logs--media-query-endpoints)

---

## 1. Authentication & ABAC Headers

The API uses Attribute-Based Access Control (ABAC) headers for identity assertion:

| Header Key | Allowed Values | Purpose |
| :--- | :--- | :--- |
| `x-user-role` | `SYSTEM_ADMIN` \| `INSTITUTIONAL_ISSUER` \| `PUBLIC_RECIPIENT` | Asserts user operation context |
| `x-institution-id` | e.g. `inst-fema`, `inst-who`, `inst-noaa` | Binds operations to a specific institution |

---

## 2. System & Health Endpoints

### `GET /api/health`
Returns backend service operational status, active Cloud Functions, and provider integration state.

* **Authentication**: None (`PUBLIC_RECIPIENT`)
* **Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "Media Authenticity Verification Platform Backend",
  "timestamp": "2026-08-20T19:45:00.000Z",
  "cloudFunctions": ["uploadMedia", "signMedia", "verifyMedia", "revokeCredential"],
  "providers": {
    "kms": "NodeCryptoKMSProvider (Cloud KMS Enclave Ready)",
    "deepfakeAi": "CloudRunDeepfakeDetector (PyTorch Model Ready)",
    "blockchain": "BlockchainProvenanceStub (Polygon L2 Anchor Ready)"
  }
}
```

---

## 3. Institutional Identity Management

### `GET /api/institutions`
Retrieves all registered institutional authorities.

* **Authentication**: Public
* **Response (200 OK)**:
```json
[
  {
    "id": "inst-fema",
    "name": "Federal Emergency Management Agency (FEMA)",
    "domain": "fema.gov",
    "status": "ACTIVE",
    "createdAt": "2026-08-19T00:00:00.000Z",
    "contactEmail": "alerts@fema.gov"
  }
]
```

### `POST /api/institutions`
Registers a new government or institutional authority.

* **Headers**: `x-user-role: SYSTEM_ADMIN`
* **Body (`application/json`)**:
```json
{
  "name": "World Health Organization (WHO)",
  "domain": "who.int",
  "contactEmail": "verify@who.int"
}
```
* **Response (201 Created)**: Returns registered institution object.

---

## 4. Credential Lifecycle & Key Revocation

### `GET /api/credentials`
Queries active and revoked credentials for an institution.

* **Query Params**: `institutionId` (optional)
* **Response (200 OK)**: Array of `KMSCredential` objects (private keys excluded).

### `POST /api/credentials`
Issues a new KMS cryptographic keypair for an institution.

* **Headers**: `x-user-role: SYSTEM_ADMIN`
* **Body (`application/json`)**:
```json
{
  "institutionId": "inst-fema",
  "algorithm": "ECDSA_P256"
}
```
* **Response (201 Created)**: Returns issued credential metadata & public key PEM.

### `POST /api/credentials/revoke`
Revokes an institutional credential immediately on the real-time Revocation Ledger.

* **Headers**: `x-user-role: SYSTEM_ADMIN`
* **Body (`application/json`)**:
```json
{
  "credentialId": "cred-fema-primary",
  "revocationReason": "Compromised key vault perimeter (CVE-2026-0812)"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Credential 'cred-fema-primary' revoked successfully.",
  "credential": {
    "id": "cred-fema-primary",
    "status": "REVOKED",
    "revokedAt": "2026-08-20T19:46:00.000Z",
    "revocationReason": "Compromised key vault perimeter (CVE-2026-0812)"
  }
}
```

---

## 5. Media Upload & KMS Hardware Signing

### `POST /api/media/upload`
Uploads official media binary, computes SHA-256 digest, and creates a pending media record.

* **Headers**: `x-user-role: INSTITUTIONAL_ISSUER`, `x-institution-id: inst-fema`
* **Body (`multipart/form-data`)**:
  - `file`: Media binary file (PDF, MP4, MP3, PNG, etc.)
  - `institutionId`: Target institution ID
  - `mediaType`: `'AUDIO'` \| `'VIDEO'` \| `'NOTICE'` \| `'EMERGENCY'`
  - `title`: Notice title
  - `noticeId`: (optional) Unique notice ID
  - `version`: (optional) Version string (e.g. `"v1.0"`, `"v2.0"`)
* **Response (201 Created)**:
```json
{
  "id": "rec-1724032800000",
  "institutionId": "inst-fema",
  "mediaHash": "8f3b2075790c...9a0c",
  "mediaType": "EMERGENCY",
  "status": "PENDING_SIGNATURE",
  "originalFileName": "tsunami_advisory.pdf",
  "storagePath": "storage/inst-fema/1724032800000-advisory.pdf"
}
```

### `POST /api/media/sign`
Applies digital signature to media digest using active KMS hardware credential.

* **Headers**: `x-user-role: INSTITUTIONAL_ISSUER`
* **Body (`application/json`)**:
```json
{
  "mediaRecordId": "rec-1724032800000",
  "credentialId": "cred-fema-primary",
  "institutionId": "inst-fema"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "signature": "MEYCIQDpZ1N9...==",
  "mediaHash": "8f3b2075790c...9a0c",
  "status": "SIGNED",
  "timestamp": "2026-08-20T19:47:00.000Z"
}
```

---

## 6. Public Zero-Trust Verification Engine

### `POST /api/media/verify`
Zero-trust endpoint to inspect media authenticity via SHA-256 hash or binary upload.

* **Authentication**: None (`PUBLIC_RECIPIENT`)
* **Body (`application/json` OR `multipart/form-data`)**:
  - JSON Mode: `{ "mediaHash": "8f3b2075790c...9a0c" }`
  - Multipart Mode: File attachment
* **Response (200 OK - Authentic)**:
```json
{
  "verdict": "AUTHENTIC",
  "trustScore": 100,
  "mediaHash": "8f3b2075790c...9a0c",
  "isSigned": true,
  "tamperDetected": false,
  "issuerId": "inst-fema",
  "institutionName": "Federal Emergency Management Agency (FEMA)",
  "credentialStatus": "ACTIVE",
  "deepfakeScore": 0.02,
  "details": "Cryptographically verified official notice issued by Federal Emergency Management Agency (FEMA)."
}
```
* **Response (200 OK - Revoked)**:
```json
{
  "verdict": "PROVEN_FAKE",
  "trustScore": 20,
  "mediaHash": "8f3b2075790c...9a0c",
  "isSigned": true,
  "tamperDetected": true,
  "issuerId": "inst-fema",
  "credentialStatus": "REVOKED",
  "details": "Revocation alert: Issuer credential has been REVOKED. Media authenticity nullified."
}
```

---

## 7. Audit Logs & Media Query Endpoints

### `GET /api/media`
Retrieves registered media records.
* **Params**: `institutionId` (optional), `status` (optional)

### `GET /api/storage/:filename`
Downloads or previews uploaded media files.

### `GET /api/verification-logs`
Queries audit trail records for compliance verification.
