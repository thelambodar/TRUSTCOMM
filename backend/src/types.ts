export type UserRole = 'INSTITUTIONAL_ISSUER' | 'PUBLIC_RECIPIENT' | 'SYSTEM_ADMIN';

export type CredentialStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export type MediaType = 'AUDIO' | 'VIDEO' | 'NOTICE' | 'EMERGENCY';

export type MediaRecordStatus = 'PENDING_SIGNATURE' | 'SIGNED' | 'REJECTED';

export type VerificationVerdict = 'AUTHENTIC' | 'UNSIGNED' | 'PROVEN_FAKE';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  displayName?: string;
}

export interface Institution {
  id: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  createdAt: string;
}

export interface Credential {
  id: string;
  institutionId: string;
  publicKey: string;
  keyAlgorithm: 'RSA-PSS-SHA256' | 'ECDSA-P256-SHA256';
  status: CredentialStatus;
  revokedAt?: string | null;
  revocationReason?: string | null;
  createdAt: string;
  expiresAt?: string;
}

export interface MediaRecord {
  id: string;
  institutionId: string;
  credentialId: string;
  mediaHash: string;
  mediaType: MediaType;
  signature: string | null;
  storagePath: string;
  blockchainTxHash: string | null;
  status: MediaRecordStatus;
  createdAt: string;
  signedAt?: string | null;
  originalFileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  title?: string;
}

export interface VerificationLog {
  id: string;
  mediaHash: string;
  verdict: VerificationVerdict;
  deepfakeScore: number | null;
  isSigned: boolean;
  issuerId: string | null;
  tamperDetected: boolean;
  checkedAt: string;
  details?: string;
  institutionName?: string;
  credentialStatus?: CredentialStatus;
}

export interface VerificationResultPayload {
  verdict: VerificationVerdict;
  mediaHash: string;
  isSigned: boolean;
  tamperDetected: boolean;
  issuerId: string | null;
  institutionName?: string;
  credentialStatus?: string;
  deepfakeScore: number | null;
  checkedAt: string;
  details: string;
  mediaRecord?: MediaRecord | null;
  logId?: string;
}
