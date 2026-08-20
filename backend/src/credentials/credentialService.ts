import { Credential, CredentialStatus } from '../types.js';
import { AuthService, AuthContext } from '../auth/authService.js';
import { kmsProvider, NodeCryptoKMSProvider } from '../cryptography/kmsProvider.js';

export interface RevokeCredentialParams {
  credentialId: string;
  revocationReason: string;
}

export interface IssueCredentialParams {
  institutionId: string;
  keyAlgorithm?: 'RSA-PSS-SHA256' | 'ECDSA-P256-SHA256';
}

export class CredentialService {
  /**
   * Revoke a credential.
   * Only SYSTEM_ADMIN can revoke a credential.
   */
  static async revokeCredential(
    auth: AuthContext | undefined,
    params: RevokeCredentialParams,
    getCredentialById: (id: string) => Promise<Credential | null>,
    updateCredentialDoc: (id: string, updates: Partial<Credential>) => Promise<Credential>
  ): Promise<Credential> {
    // 1. Authenticate caller and assert SYSTEM_ADMIN role
    AuthService.assertSystemAdmin(auth);

    if (!params.credentialId) {
      throw new Error('INVALID_ARGUMENT: credentialId is required');
    }

    if (!params.revocationReason || params.revocationReason.trim() === '') {
      throw new Error('INVALID_ARGUMENT: revocationReason is required when revoking a credential');
    }

    // 2. Fetch credential
    const credential = await getCredentialById(params.credentialId);
    if (!credential) {
      throw new Error(`NOT_FOUND: Credential '${params.credentialId}' was not found.`);
    }

    if (credential.status === 'REVOKED') {
      throw new Error(`FAILED_PRECONDITION: Credential '${params.credentialId}' is already REVOKED.`);
    }

    const now = new Date().toISOString();

    // 3. Update credential document with status REVOKED, revokedAt, and revocation reason
    const updated = await updateCredentialDoc(params.credentialId, {
      status: 'REVOKED',
      revokedAt: now,
      revocationReason: params.revocationReason.trim(),
    });

    return updated;
  }

  /**
   * Helper to issue a new cryptographic credential for an institution.
   */
  static async issueCredential(
    auth: AuthContext | undefined,
    params: IssueCredentialParams,
    createCredentialDoc: (cred: Omit<Credential, 'id'>) => Promise<Credential>
  ): Promise<Credential> {
    AuthService.assertSystemAdmin(auth);

    const algorithm = params.keyAlgorithm || 'RSA-PSS-SHA256';
    const keyPair = await kmsProvider.generateKeyPair(algorithm);

    const newCred: Omit<Credential, 'id'> = {
      institutionId: params.institutionId,
      publicKey: keyPair.publicKeyPem,
      keyAlgorithm: algorithm,
      status: 'ACTIVE',
      revokedAt: null,
      revocationReason: null,
      createdAt: new Date().toISOString(),
    };

    const created = await createCredentialDoc(newCred);
    NodeCryptoKMSProvider.associateKey(created.id, keyPair.privateKeyId);
    return created;
  }
}
