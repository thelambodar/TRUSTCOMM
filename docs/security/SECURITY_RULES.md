# Security & Access Control Matrix: SOA IDEATHON 2026 – Problem Statement S26

## 1. Role-Based Access Control (RBAC) Specification

| Role | Description | Permissions |
| :--- | :--- | :--- |
| `PUBLIC_RECIPIENT` | Citizens, journalists, downstream consumer services | Query institution directories, download public keys, verify media hashes, download verified media. |
| `INSTITUTIONAL_ISSUER` | Verified institutional communications officer | Upload official media to institution storage path, request digital signature using institution's active credentials, inspect institution manifests. |
| `SYSTEM_ADMIN` | Platform security administrator | Register new institutions, issue cryptographic keypairs, revoke compromised credentials, audit all verification log streams. |

---

## 2. Firestore Security Rules Reference (`firestore.rules`)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Default-deny all unhandled collections
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isSystemAdmin() {
      return isSignedIn() && (
        request.auth.token.role == 'SYSTEM_ADMIN' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }

    function isInstitutionalIssuer(institutionId) {
      return isSignedIn() && (
        (request.auth.token.role == 'INSTITUTIONAL_ISSUER' && request.auth.token.institutionId == institutionId) ||
        isSystemAdmin()
      );
    }

    // 1. institutions: Public directory; Admin-managed
    match /institutions/{institutionId} {
      allow get, list: if true;
      allow create, update, delete: if false;
    }

    // 2. credentials: Public key discovery; KMS-managed
    match /credentials/{credentialId} {
      allow get, list: if true;
      allow create, update, delete: if false;
    }

    // 3. mediaRecords: Public hash queries; Cloud Function write-only
    match /mediaRecords/{recordId} {
      allow get, list: if true;
      allow create, update, delete: if false;
    }

    // 4. verificationLogs: Read-only for System Admins; verifyMedia-generated
    match /verificationLogs/{logId} {
      allow get, list: if isSystemAdmin();
      allow create, update, delete: if false;
    }
  }
}
```

---

## 3. Storage Security Rules Reference (`storage.rules`)

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isInstitutionalIssuer(institutionId) {
      return isSignedIn() && (
        (request.auth.token.role == 'INSTITUTIONAL_ISSUER' && request.auth.token.institutionId == institutionId) ||
        request.auth.token.role == 'SYSTEM_ADMIN'
      );
    }

    // Isolation by institution: media/institutions/{institutionId}/{fileName}
    match /media/institutions/{institutionId}/{fileName} {
      allow read: if true;
      allow write: if isInstitutionalIssuer(institutionId)
        && request.resource.size < 100 * 1024 * 1024
        && (
          request.resource.contentType.matches('audio/.*') ||
          request.resource.contentType.matches('video/.*') ||
          request.resource.contentType.matches('application/pdf') ||
          request.resource.contentType.matches('text/.*') ||
          request.resource.contentType.matches('application/.*')
        );
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
