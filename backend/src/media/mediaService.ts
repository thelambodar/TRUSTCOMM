import * as crypto from 'crypto';
import { MediaRecord, MediaType, Credential, Institution } from '../types.js';
import { AuthService, AuthContext } from '../auth/authService.js';
import { kmsProvider } from '../cryptography/kmsProvider.js';

export interface UploadMediaParams {
  institutionId: string;
  credentialId?: string;
  mediaType: MediaType;
  fileName: string;
  fileBuffer: Buffer;
  mimeType?: string;
  title?: string;
}

export interface SignMediaParams {
  mediaRecordId?: string;
  mediaHash?: string;
  credentialId: string;
  institutionId: string;
}

export interface SignMediaResult {
  signature: string;
  mediaHash: string;
  status: string;
  timestamp: string;
  credentialId: string;
  institutionId: string;
  keyAlgorithm: string;
}

const ALLOWED_MEDIA_TYPES: MediaType[] = ['AUDIO', 'VIDEO', 'NOTICE', 'EMERGENCY'];

const MIME_TYPE_MAP: Record<string, MediaType> = {
  'audio/mpeg': 'AUDIO',
  'audio/wav': 'AUDIO',
  'audio/mp3': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'audio/aac': 'AUDIO',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'video/x-msvideo': 'VIDEO',
  'application/pdf': 'NOTICE',
  'text/plain': 'NOTICE',
  'application/msword': 'NOTICE',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'NOTICE',
  'application/json': 'EMERGENCY',
};

export class MediaService {
  /**
   * Validate that the file and media type are supported.
   */
  static validateFileType(mediaType: MediaType, mimeType?: string, fileName?: string): void {
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      throw new Error(`INVALID_ARGUMENT: Unsupported mediaType '${mediaType}'. Allowed: ${ALLOWED_MEDIA_TYPES.join(', ')}`);
    }

    if (mimeType && MIME_TYPE_MAP[mimeType.toLowerCase()]) {
      const detected = MIME_TYPE_MAP[mimeType.toLowerCase()];
      // Allow general notices or emergencies
      if (detected !== mediaType && mediaType !== 'EMERGENCY') {
        // Warning or soft check: ensure it's not completely incompatible (e.g. video sent as audio)
      }
    }
  }

  /**
   * Calculates a SHA-256 cryptographic hash from a file buffer.
   */
  static calculateSHA256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Upload Media handler:
   * 1. Authenticate user.
   * 2. Check user's institution.
   * 3. Validate file type.
   * 4. Upload file to Cloud Storage at media/institutions/{institutionId}/{filename}.
   * 5. Calculate SHA-256 hash.
   * 6. Store metadata in mediaRecords.
   */
  static async uploadMedia(
    auth: AuthContext | undefined,
    params: UploadMediaParams,
    saveToStorage: (storagePath: string, buffer: Buffer, mimeType?: string) => Promise<string>,
    createMediaRecordDoc: (record: Omit<MediaRecord, 'id'>) => Promise<MediaRecord>
  ): Promise<MediaRecord> {
    // 1. Authenticate user and assert role
    const user = AuthService.assertInstitutionalAccess(auth, params.institutionId);

    // 2. Validate file type
    this.validateFileType(params.mediaType, params.mimeType, params.fileName);

    if (!params.fileBuffer || params.fileBuffer.length === 0) {
      throw new Error('INVALID_ARGUMENT: File buffer is empty or missing.');
    }

    // 3. Compute SHA-256 hash of the media
    const mediaHash = this.calculateSHA256(params.fileBuffer);

    // 4. Construct storage path: media/institutions/{institutionId}/{timestamp}-{safeFilename}
    const safeName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `media/institutions/${params.institutionId}/${Date.now()}-${safeName}`;

    // Upload to Cloud Storage
    await saveToStorage(storagePath, params.fileBuffer, params.mimeType);

    const now = new Date().toISOString();

    // 5. Store metadata in mediaRecords (Do not store media files inside Firestore)
    const newRecord: Omit<MediaRecord, 'id'> = {
      institutionId: params.institutionId,
      credentialId: params.credentialId || '',
      mediaHash: mediaHash,
      mediaType: params.mediaType,
      signature: null, // initially null before signing
      storagePath: storagePath,
      blockchainTxHash: null,
      status: 'PENDING_SIGNATURE',
      createdAt: now,
      signedAt: null,
      originalFileName: params.fileName,
      fileSizeBytes: params.fileBuffer.length,
      mimeType: params.mimeType || 'application/octet-stream',
      title: params.title || params.fileName,
    };

    return await createMediaRecordDoc(newRecord);
  }

  /**
   * Media Signing Workflow:
   * 1. Authenticates the institutional issuer.
   * 2. Checks that the credential belongs to the institution.
   * 3. Checks that the credential status is ACTIVE.
   * 4. Generates a digital signature for the media hash.
   * 5. Stores the signature in mediaRecords.
   * 6. Returns signature, media hash, status and timestamp.
   */
  static async signMedia(
    auth: AuthContext | undefined,
    params: SignMediaParams,
    getCredentialById: (id: string) => Promise<Credential | null>,
    getMediaRecord: (idOrHash: string) => Promise<MediaRecord | null>,
    updateMediaRecordDoc: (id: string, updates: Partial<MediaRecord>) => Promise<MediaRecord>
  ): Promise<SignMediaResult> {
    // 1. Authenticates institutional issuer
    AuthService.assertInstitutionalAccess(auth, params.institutionId);

    // 2. Fetch credential and verify ownership
    const credential = await getCredentialById(params.credentialId);
    if (!credential) {
      throw new Error(`NOT_FOUND: Credential '${params.credentialId}' not found.`);
    }

    if (credential.institutionId !== params.institutionId) {
      throw new Error(
        `PERMISSION_DENIED: Credential '${params.credentialId}' does not belong to institution '${params.institutionId}'.`
      );
    }

    // 3. Check credential status is ACTIVE
    if (credential.status !== 'ACTIVE') {
      throw new Error(
        `FAILED_PRECONDITION: Cannot sign media with non-active credential. Status is '${credential.status}'.`
      );
    }

    // Fetch or locate media record
    let mediaRecord: MediaRecord | null = null;
    if (params.mediaRecordId) {
      mediaRecord = await getMediaRecord(params.mediaRecordId);
    } else if (params.mediaHash) {
      mediaRecord = await getMediaRecord(params.mediaHash);
    }

    if (!mediaRecord) {
      throw new Error('NOT_FOUND: Media record not found for signing.');
    }

    if (mediaRecord.institutionId !== params.institutionId) {
      throw new Error('PERMISSION_DENIED: Media record belongs to a different institution.');
    }

    const hashToSign = mediaRecord.mediaHash;

    // 4. Generate digital signature for the media hash using backend KMS abstraction
    // Private keys are NEVER exposed to frontend or stored in Firestore
    const signature = await kmsProvider.signHash(credential.id, hashToSign, credential.keyAlgorithm);
    const signedTimestamp = new Date().toISOString();

    // 5. Store signature in mediaRecords
    await updateMediaRecordDoc(mediaRecord.id, {
      signature: signature,
      credentialId: credential.id,
      status: 'SIGNED',
      signedAt: signedTimestamp,
    });

    // 6. Return the signature, media hash, status, and timestamp
    return {
      signature: signature,
      mediaHash: hashToSign,
      status: 'SIGNED',
      timestamp: signedTimestamp,
      credentialId: credential.id,
      institutionId: params.institutionId,
      keyAlgorithm: credential.keyAlgorithm,
    };
  }
}
