import * as crypto from 'crypto';

/**
 * Modular interface for Cryptographic Key Management & Signing.
 * Designed to allow plugging in Google Cloud KMS (Key Management Service) or HSMs.
 */
export interface IKMSProvider {
  signHash(credentialId: string, hashHex: string, algorithm?: string): Promise<string>;
  verifySignature(publicKeyPem: string, hashHex: string, signatureBase64: string, algorithm?: string): Promise<boolean>;
  generateKeyPair(algorithm?: 'RSA-PSS-SHA256' | 'ECDSA-P256-SHA256'): Promise<{ publicKeyPem: string; privateKeyId: string }>;
}

/**
 * Backend Cryptographic Provider implementation using Node.js crypto.
 * In a production deployment, this maps to Google Cloud KMS `projects/{project}/locations/{location}/keyRings/{ring}/cryptoKeys/{key}/cryptoKeyVersions/{version}:asymmetricSign`.
 * Private keys are kept securely inside the backend vault / KMS and NEVER exposed to frontend or stored in Firestore.
 */
export class NodeCryptoKMSProvider implements IKMSProvider {
  // In-memory / secure backend enclave private key vault (simulating GCP KMS Hardware Security Module)
  private static privateKeyVault: Map<string, string> = new Map();

  /**
   * Generates a new cryptographic key pair and returns the public key PEM + internal private key identifier.
   */
  async generateKeyPair(algorithm: 'RSA-PSS-SHA256' | 'ECDSA-P256-SHA256' = 'RSA-PSS-SHA256'): Promise<{ publicKeyPem: string; privateKeyId: string }> {
    const keyId = `kms-key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (algorithm === 'ECDSA-P256-SHA256') {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      NodeCryptoKMSProvider.privateKeyVault.set(keyId, privateKey);
      return { publicKeyPem: publicKey, privateKeyId: keyId };
    } else {
      // Default: RSA-PSS 2048/4096-bit
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      NodeCryptoKMSProvider.privateKeyVault.set(keyId, privateKey);
      return { publicKeyPem: publicKey, privateKeyId: keyId };
    }
  }

  /**
   * Signs a SHA-256 media hash using the secure private key in the KMS vault.
   */
  async signHash(credentialId: string, hashHex: string, algorithm: string = 'RSA-PSS-SHA256'): Promise<string> {
    const privateKey = NodeCryptoKMSProvider.privateKeyVault.get(credentialId);
    if (!privateKey) {
      // If simulated key is not yet in vault for a freshly initialized credential, generate a dedicated private key for it
      const { privateKey: newPrivKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      NodeCryptoKMSProvider.privateKeyVault.set(credentialId, newPrivKey);
      return this.signHash(credentialId, hashHex, algorithm);
    }

    const dataBuffer = Buffer.from(hashHex, 'hex');
    const signer = crypto.createSign('SHA256');
    signer.update(dataBuffer);
    signer.end();

    const signature = signer.sign(privateKey, 'base64');
    return signature;
  }

  /**
   * Verifies the cryptographic signature against the public key and media hash.
   */
  async verifySignature(publicKeyPem: string, hashHex: string, signatureBase64: string, _algorithm: string = 'RSA-PSS-SHA256'): Promise<boolean> {
    try {
      const dataBuffer = Buffer.from(hashHex, 'hex');
      const verifier = crypto.createVerify('SHA256');
      verifier.update(dataBuffer);
      verifier.end();

      return verifier.verify(publicKeyPem, signatureBase64, 'base64');
    } catch (err) {
      console.error('Signature verification error:', err);
      return false;
    }
  }

  /**
   * Helper to set a key in the vault if seeded
   */
  static registerKey(keyId: string, privateKeyPem: string) {
    NodeCryptoKMSProvider.privateKeyVault.set(keyId, privateKeyPem);
  }
}

// Export singleton KMS Provider instance
export const kmsProvider: IKMSProvider = new NodeCryptoKMSProvider();
