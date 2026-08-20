/**
 * Media Authenticity Verification Platform - Backend & Cloud Functions Entry Point
 *
 * Backend Functions:
 * 1. uploadMedia (Institutional Issuer media upload, SHA-256 computation, Cloud Storage routing, mediaRecords metadata)
 * 2. signMedia (Cryptographic signature generation for media hash using secure backend KMS abstraction)
 * 3. verifyMedia (Public media authenticity verification pipeline returning AUTHENTIC, UNSIGNED, PROVEN_FAKE)
 * 4. revokeCredential (SYSTEM_ADMIN credential revocation workflow)
 */

import { AuthService, AuthContext } from './auth/authService.js';
import { MediaService, UploadMediaParams, SignMediaParams } from './media/mediaService.js';
import { VerificationService, VerifyMediaParams } from './verification/verificationService.js';
import { CredentialService, RevokeCredentialParams } from './credentials/credentialService.js';
import { kmsProvider, IKMSProvider } from './cryptography/kmsProvider.js';
import { deepfakeDetector, blockchainProvider } from './verification/modularProviders.js';
import {
  UserRole,
  CredentialStatus,
  MediaType,
  MediaRecord,
  Credential,
  Institution,
  VerificationLog,
  VerificationVerdict,
} from './types.js';

export {
  AuthService,
  MediaService,
  VerificationService,
  CredentialService,
  kmsProvider,
  deepfakeDetector,
  blockchainProvider,
};

export type {
  UserRole,
  CredentialStatus,
  MediaType,
  MediaRecord,
  Credential,
  Institution,
  VerificationLog,
  VerificationVerdict,
  AuthContext,
  UploadMediaParams,
  SignMediaParams,
  VerifyMediaParams,
  RevokeCredentialParams,
  IKMSProvider,
};

/**
 * Callable/HTTP Cloud Function definition for uploadMedia
 */
export async function uploadMediaHandler(
  auth: AuthContext | undefined,
  params: UploadMediaParams,
  storageDriver: (path: string, buffer: Buffer, mime?: string) => Promise<string>,
  dbDriver: {
    createMediaRecord: (r: Omit<MediaRecord, 'id'>) => Promise<MediaRecord>;
  }
) {
  return await MediaService.uploadMedia(auth, params, storageDriver, dbDriver.createMediaRecord);
}

/**
 * Callable/HTTP Cloud Function definition for signMedia
 */
export async function signMediaHandler(
  auth: AuthContext | undefined,
  params: SignMediaParams,
  dbDriver: {
    getCredentialById: (id: string) => Promise<Credential | null>;
    getMediaRecord: (id: string) => Promise<MediaRecord | null>;
    updateMediaRecord: (id: string, updates: Partial<MediaRecord>) => Promise<MediaRecord>;
  }
) {
  return await MediaService.signMedia(
    auth,
    params,
    dbDriver.getCredentialById,
    dbDriver.getMediaRecord,
    dbDriver.updateMediaRecord
  );
}

/**
 * Callable/HTTP Cloud Function definition for verifyMedia (Public verification)
 */
export async function verifyMediaHandler(
  params: VerifyMediaParams,
  dbDriver: {
    findMediaRecordByHash: (hash: string) => Promise<MediaRecord | null>;
    getCredentialById: (id: string) => Promise<Credential | null>;
    getInstitutionById: (id: string) => Promise<Institution | null>;
    createVerificationLog: (log: Omit<VerificationLog, 'id'>) => Promise<VerificationLog>;
  }
) {
  return await VerificationService.verifyMedia(
    params,
    dbDriver.findMediaRecordByHash,
    dbDriver.getCredentialById,
    dbDriver.getInstitutionById,
    dbDriver.createVerificationLog
  );
}

/**
 * Callable/HTTP Cloud Function definition for revokeCredential (SYSTEM_ADMIN only)
 */
export async function revokeCredentialHandler(
  auth: AuthContext | undefined,
  params: RevokeCredentialParams,
  dbDriver: {
    getCredentialById: (id: string) => Promise<Credential | null>;
    updateCredential: (id: string, updates: Partial<Credential>) => Promise<Credential>;
  }
) {
  return await CredentialService.revokeCredential(
    auth,
    params,
    dbDriver.getCredentialById,
    dbDriver.updateCredential
  );
}
