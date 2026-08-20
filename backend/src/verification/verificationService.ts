import {
  MediaRecord,
  Credential,
  Institution,
  VerificationLog,
  VerificationVerdict,
  VerificationResultPayload,
} from '../types.js';
import { kmsProvider } from '../cryptography/kmsProvider.js';
import { deepfakeDetector } from './modularProviders.js';

export interface VerifyMediaParams {
  mediaHash: string;
}

export class VerificationService {
  /**
   * Public Media Verification Workflow:
   * 1. Query mediaRecords by mediaHash.
   * 2. If record found, check cryptographic signature & credential status.
   * 3. Run AI Deepfake inspection stub/provider.
   * 4. Determine final verdict (AUTHENTIC, UNSIGNED, or PROVEN_FAKE).
   * 5. Log verification outcome to audit logs and return payload.
   */
  public static async verifyMedia(
    params: VerifyMediaParams,
    findMediaRecordByHash: (hash: string) => Promise<MediaRecord | null>,
    getCredentialById: (id: string) => Promise<Credential | null>,
    getInstitutionById: (id: string) => Promise<Institution | null>,
    createVerificationLog: (log: Omit<VerificationLog, 'id'>) => Promise<VerificationLog>
  ): Promise<VerificationResultPayload> {
    const { mediaHash } = params;
    const now = new Date().toISOString();

    const mediaRecord = await findMediaRecordByHash(mediaHash);

    // Run modular AI deepfake inspection
    const aiResult = await deepfakeDetector.analyzeMedia(
      mediaRecord?.storagePath || '',
      mediaRecord?.mediaType || 'NOTICE'
    );

    if (!mediaRecord) {
      const verdict: VerificationVerdict = 'UNSIGNED';
      const resultPayload: VerificationResultPayload = {
        verdict,
        mediaHash,
        isSigned: false,
        tamperDetected: false,
        issuerId: null,
        institutionName: undefined,
        credentialStatus: undefined,
        deepfakeScore: aiResult.deepfakeScore,
        checkedAt: now,
        details: 'No institutional record found for the provided media hash. Content is unsigned.',
        mediaRecord: null,
      };

      const createdLog = await createVerificationLog({
        mediaHash,
        verdict,
        deepfakeScore: aiResult.deepfakeScore,
        isSigned: false,
        issuerId: null,
        tamperDetected: false,
        checkedAt: now,
        details: resultPayload.details,
      });

      resultPayload.logId = createdLog.id;
      return resultPayload;
    }

    // Media record exists - verify signing and credentials
    const credential = mediaRecord.credentialId
      ? await getCredentialById(mediaRecord.credentialId)
      : null;

    const institution = mediaRecord.institutionId
      ? await getInstitutionById(mediaRecord.institutionId)
      : null;

    const isSigned = mediaRecord.status === 'SIGNED' && !!mediaRecord.signature;
    let signatureValid = false;

    if (isSigned && credential && mediaRecord.signature) {
      signatureValid = await kmsProvider.verifySignature(
        credential.publicKey,
        mediaRecord.mediaHash,
        mediaRecord.signature,
        credential.keyAlgorithm
      );
    }

    let tamperDetected = false;
    let verdict: VerificationVerdict = 'AUTHENTIC';
    let details = 'Media authenticity successfully verified. Cryptographic signature and institutional credentials valid.';

    if (!isSigned) {
      verdict = 'UNSIGNED';
      details = 'Media record exists but is pending signature.';
    } else if (credential?.status === 'REVOKED') {
      verdict = 'PROVEN_FAKE';
      tamperDetected = true;
      details = `Signer credential '${credential.id}' was REVOKED on ${credential.revokedAt || 'earlier date'}. Reason: ${credential.revocationReason || 'Security breach'}`;
    } else if (!signatureValid) {
      verdict = 'PROVEN_FAKE';
      tamperDetected = true;
      details = 'Cryptographic signature mismatch or tampered content detected.';
    } else if (aiResult.deepfakeScore > 0.75) {
      verdict = 'PROVEN_FAKE';
      tamperDetected = true;
      details = `AI Deepfake inspection flagged media as high-risk manipulation anomaly (Score: ${(aiResult.deepfakeScore * 100).toFixed(1)}%).`;
    }

    const resultPayload: VerificationResultPayload = {
      verdict,
      mediaHash,
      isSigned,
      tamperDetected,
      issuerId: mediaRecord.institutionId,
      institutionName: institution?.name,
      credentialStatus: credential?.status,
      deepfakeScore: aiResult.deepfakeScore,
      checkedAt: now,
      details,
      mediaRecord,
    };

    const createdLog = await createVerificationLog({
      mediaHash,
      verdict,
      deepfakeScore: aiResult.deepfakeScore,
      isSigned,
      issuerId: mediaRecord.institutionId,
      tamperDetected,
      checkedAt: now,
      details,
      institutionName: institution?.name,
      credentialStatus: credential?.status,
    });

    resultPayload.logId = createdLog.id;
    return resultPayload;
  }
}
