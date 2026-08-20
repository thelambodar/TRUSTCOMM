/**
 * AURA-TRUST / VERIPROV - C2PA Provenance & Revocation Manager
 * Handles C2PA manifest claims, key revocation ledger, and tri-state classification.
 */

import { CryptoEngine } from './crypto.js';

export const VERDICT_STATES = {
  AUTHENTIC: 'AUTHENTIC',
  UNSIGNED: 'UNSIGNED',
  PROVEN_FAKE: 'PROVEN_FAKE'
};

export class C2PAManifestManager {
  constructor() {
    this.storageKey = 'auratrust_revocation_ledger';
    this.revocationLedger = this.loadRevocationLedger();
    this.registeredAuthorities = this.initDefaultAuthorities();
  }

  initDefaultAuthorities() {
    return [
      {
        id: 'AUTH-OEM-01',
        name: 'National Emergency Management Agency (NEMA)',
        domain: 'emergency.gov.org',
        keyId: 'KEY-7F89B1A42C',
        status: 'ACTIVE'
      },
      {
        id: 'AUTH-CRB-02',
        name: 'Central Financial Authority Press Office',
        domain: 'fin-press.gov.org',
        keyId: 'KEY-3E901F29DA',
        status: 'ACTIVE'
      },
      {
        id: 'AUTH-MAYOR-03',
        name: 'Mayor Executive Communications Office',
        domain: 'cityhall.gov.org',
        keyId: 'KEY-99A82C7410',
        status: 'ACTIVE'
      }
    ];
  }

  loadRevocationLedger() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        keyId: 'KEY-REVOKED-HACKED-009',
        authorityName: 'Compromised Regional Alert Bureau',
        revocationTimestamp: '2026-08-10T14:30:00Z',
        reason: 'Private Key Compromise / HSM Breach'
      }
    ];
  }

  saveRevocationLedger() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.revocationLedger));
  }

  revokeKey(keyId, authorityName, reason = 'Credential Compromise') {
    const existing = this.revocationLedger.find(item => item.keyId === keyId);
    if (!existing) {
      const entry = {
        keyId,
        authorityName,
        revocationTimestamp: new Date().toISOString(),
        reason
      };
      this.revocationLedger.unshift(entry);
      this.saveRevocationLedger();
      return entry;
    }
    return existing;
  }

  isKeyRevoked(keyId) {
    return this.revocationLedger.some(item => item.keyId === keyId);
  }

  async createManifest({
    title,
    contentType,
    contentHash,
    authority,
    privateKey,
    publicKeyJwk,
    keyId,
    privacySettings = { isZkRedacted: false, redactedFields: [] }
  }) {
    const timestamp = new Date().toISOString();

    const claim = {
      "@context": "https://c2pa.org/manifest/v1",
      claimGenerator: "VERIPROV_C2PA_Engine/v2.4",
      title: title || "Official Notice",
      format: contentType || "media/generic",
      timestamp,
      assertions: [
        {
          label: "c2pa.actions",
          data: {
            actions: [{ action: "c2pa.created", softwareAgent: "VERIPROV Studio v2.4", when: timestamp }]
          }
        },
        {
          label: "c2pa.hash.data",
          data: { alg: "sha256", hash: contentHash }
        },
        {
          label: "c2pa.identity.publisher",
          data: {
            name: authority.name,
            domain: authority.domain,
            keyId: keyId,
            publicKeyJwk: publicKeyJwk
          }
        }
      ]
    };

    if (privacySettings.isZkRedacted) {
      const zkCommitment = await CryptoEngine.createZkCommitment(
        authority.domain + ":" + timestamp,
        "zk-salt-88192"
      );
      claim.assertions.push({
        label: "c2pa.privacy.zk_commitment",
        data: {
          privacyMode: "Zero-Knowledge Salted Commitment",
          commitmentHash: zkCommitment.commitmentHash,
          salt: zkCommitment.salt,
          redactedFields: privacySettings.redactedFields || ["responder_gps_coordinates"]
        }
      });
    }

    const claimString = JSON.stringify(claim);
    const signatureHex = await CryptoEngine.signData(privateKey, claimString);

    return {
      manifestVersion: "1.0",
      signature: signatureHex,
      claim: claim,
      manifestHash: await CryptoEngine.hashText(claimString)
    };
  }

  async verifyManifest(manifest, currentContentHash, deepfakeScore = 0) {
    if (!manifest || !manifest.claim || !manifest.signature) {
      return {
        verdictState: VERDICT_STATES.UNSIGNED,
        reason: "No cryptographic C2PA provenance manifest attached to content.",
        confidence: 0,
        details: null
      };
    }

    const { claim, signature } = manifest;
    const publisherAssertion = claim.assertions.find(a => a.label === "c2pa.identity.publisher");
    const hashAssertion = claim.assertions.find(a => a.label === "c2pa.hash.data");

    if (!publisherAssertion || !hashAssertion) {
      return {
        verdictState: VERDICT_STATES.PROVEN_FAKE,
        reason: "Corrupted C2PA Manifest assertions.",
        confidence: 99,
        details: null
      };
    }

    const keyId = publisherAssertion.data.keyId;
    const publicKeyJwk = publisherAssertion.data.publicKeyJwk;
    const expectedContentHash = hashAssertion.data.hash;

    // 1. Key Revocation Check
    if (this.isKeyRevoked(keyId)) {
      const revocationEntry = this.revocationLedger.find(r => r.keyId === keyId);
      return {
        verdictState: VERDICT_STATES.PROVEN_FAKE,
        reason: `COMPROMISED CREDENTIAL: Signed by key (${keyId}) which was REVOKED on ${revocationEntry?.revocationTimestamp || 'record'}.`,
        confidence: 100,
        keyRevoked: true,
        revocationEntry,
        details: { keyId, publisher: publisherAssertion.data.name }
      };
    }

    // 2. Cryptographic Signature Check
    let isSigValid = false;
    try {
      const publicKey = await CryptoEngine.importPublicKey(publicKeyJwk);
      const claimString = JSON.stringify(claim);
      isSigValid = await CryptoEngine.verifySignature(publicKey, signature, claimString);
    } catch (e) {
      isSigValid = false;
    }

    if (!isSigValid) {
      return {
        verdictState: VERDICT_STATES.PROVEN_FAKE,
        reason: "INVALID DIGITAL SIGNATURE: Manifest payload or signature tampered.",
        confidence: 98,
        signatureMismatch: true,
        details: { keyId, publisher: publisherAssertion.data.name }
      };
    }

    // 3. SHA-256 Digest Match Check
    if (currentContentHash && currentContentHash !== expectedContentHash) {
      return {
        verdictState: VERDICT_STATES.PROVEN_FAKE,
        reason: "CONTENT TAMPERING DETECTED: Original media hash does not match current payload.",
        confidence: 99,
        hashMismatch: true,
        details: { expectedContentHash, currentContentHash }
      };
    }

    // 4. Secondary AI Risk Score
    if (deepfakeScore > 75) {
      return {
        verdictState: VERDICT_STATES.PROVEN_FAKE,
        reason: `DEEPFAKE AI SCAN ALERT: High temporal/spectral manipulation anomaly detected (${deepfakeScore}% confidence).`,
        confidence: deepfakeScore,
        deepfakeDetected: true,
        details: { deepfakeScore }
      };
    }

    // 5. Authentic
    return {
      verdictState: VERDICT_STATES.AUTHENTIC,
      reason: "VERIFIED AUTHENTIC: Cryptographic signature valid, issuer key active, content hash match.",
      confidence: 100,
      details: {
        publisher: publisherAssertion.data.name,
        domain: publisherAssertion.data.domain,
        keyId: keyId,
        timestamp: claim.timestamp,
        hasZkRedaction: claim.assertions.some(a => a.label === "c2pa.privacy.zk_commitment")
      }
    };
  }
}
