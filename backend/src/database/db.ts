import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { Institution, Credential, MediaRecord, VerificationLog, UserProfile, UserRole } from '../types.js';
import { kmsProvider, NodeCryptoKMSProvider } from '../cryptography/kmsProvider.js';

export interface BackendDatabase {
  institutions: Map<string, Institution>;
  credentials: Map<string, Credential>;
  mediaRecords: Map<string, MediaRecord>;
  verificationLogs: VerificationLog[];
  storageFiles: Map<string, { buffer: Buffer; mimeType?: string; originalName: string }>;
}

export class InMemoryDB {
  private static instance: InMemoryDB;
  public institutions = new Map<string, Institution>();
  public credentials = new Map<string, Credential>();
  public mediaRecords = new Map<string, MediaRecord>();
  public verificationLogs: VerificationLog[] = [];
  public storageFiles = new Map<string, { buffer: Buffer; mimeType?: string; originalName: string }>();

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): InMemoryDB {
    if (!InMemoryDB.instance) {
      InMemoryDB.instance = new InMemoryDB();
    }
    return InMemoryDB.instance;
  }

  private async seedInitialData() {
    const now = new Date().toISOString();

    // 1. Seed Institutions
    const inst1: Institution = {
      id: 'inst-fema',
      name: 'Federal Emergency Management Agency (FEMA)',
      domain: 'fema.gov',
      status: 'ACTIVE',
      createdAt: '2025-01-10T00:00:00.000Z',
    };

    const inst2: Institution = {
      id: 'inst-who',
      name: 'World Health Organization (WHO Dispatch)',
      domain: 'who.int',
      status: 'ACTIVE',
      createdAt: '2025-02-15T00:00:00.000Z',
    };

    const inst3: Institution = {
      id: 'inst-noaa',
      name: 'National Oceanic & Atmospheric Administration (NOAA)',
      domain: 'noaa.gov',
      status: 'ACTIVE',
      createdAt: '2025-03-01T00:00:00.000Z',
    };

    this.institutions.set(inst1.id, inst1);
    this.institutions.set(inst2.id, inst2);
    this.institutions.set(inst3.id, inst3);

    // 2. Generate and seed Active Credentials with KMS keys
    const credPair1 = await kmsProvider.generateKeyPair('RSA-PSS-SHA256');
    const cred1: Credential = {
      id: 'cred-fema-primary',
      institutionId: inst1.id,
      publicKey: credPair1.publicKeyPem,
      keyAlgorithm: 'RSA-PSS-SHA256',
      status: 'ACTIVE',
      revokedAt: null,
      revocationReason: null,
      createdAt: '2025-01-11T00:00:00.000Z',
    };
    NodeCryptoKMSProvider.registerKey(cred1.id, (kmsProvider as any).privateKeyVault?.get(credPair1.privateKeyId) || '');
    this.credentials.set(cred1.id, cred1);

    const credPair2 = await kmsProvider.generateKeyPair('ECDSA-P256-SHA256');
    const cred2: Credential = {
      id: 'cred-who-active',
      institutionId: inst2.id,
      publicKey: credPair2.publicKeyPem,
      keyAlgorithm: 'ECDSA-P256-SHA256',
      status: 'ACTIVE',
      revokedAt: null,
      revocationReason: null,
      createdAt: '2025-02-16T00:00:00.000Z',
    };
    this.credentials.set(cred2.id, cred2);

    // Seed a REVOKED Credential for testing revocation alerts
    const credPairRevoked = await kmsProvider.generateKeyPair('RSA-PSS-SHA256');
    const credRevoked: Credential = {
      id: 'cred-fema-compromised-2024',
      institutionId: inst1.id,
      publicKey: credPairRevoked.publicKeyPem,
      keyAlgorithm: 'RSA-PSS-SHA256',
      status: 'REVOKED',
      revokedAt: '2026-04-12T14:30:00.000Z',
      revocationReason: 'Suspected private key exposure during security perimeter audit (CVE-2026-0812)',
      createdAt: '2024-06-01T00:00:00.000Z',
    };
    this.credentials.set(credRevoked.id, credRevoked);

    // 3. Seed Sample Official Media Records
    // Seed Sample 1: Signed FEMA Emergency Audio
    const femaNoticeContent = Buffer.from('OFFICIAL FEMA EMERGENCY ADVISORY: Level 4 Severe Coastal Weather Alert issued for Eastern Seaboard. Immediate evacuation orders in effect.');
    const femaHash = crypto.createHash('sha256').update(femaNoticeContent).digest('hex');
    const femaStoragePath = `media/institutions/inst-fema/official_emergency_advisory_2026.pdf`;
    this.storageFiles.set(femaStoragePath, {
      buffer: femaNoticeContent,
      mimeType: 'application/pdf',
      originalName: 'official_emergency_advisory_2026.pdf',
    });

    const femaSignature = await kmsProvider.signHash(cred1.id, femaHash, 'RSA-PSS-SHA256');

    const media1: MediaRecord = {
      id: 'rec-fema-001',
      institutionId: inst1.id,
      credentialId: cred1.id,
      mediaHash: femaHash,
      mediaType: 'EMERGENCY',
      signature: femaSignature,
      storagePath: femaStoragePath,
      blockchainTxHash: `0x${femaHash.substring(0, 40)}`,
      status: 'SIGNED',
      createdAt: '2026-08-01T10:00:00.000Z',
      signedAt: '2026-08-01T10:05:00.000Z',
      originalFileName: 'official_emergency_advisory_2026.pdf',
      fileSizeBytes: femaNoticeContent.length,
      mimeType: 'application/pdf',
      title: 'FEMA Level 4 Coastal Evacuation Notice',
    };
    this.mediaRecords.set(media1.id, media1);

    // Seed Sample 2: Revoked Credential Signed Media (Will trigger PROVEN_FAKE due to revocation)
    const revokedContent = Buffer.from('DEPRECATED BULLETIN: Old 2024 Disaster Assistance Guidelines');
    const revokedHash = crypto.createHash('sha256').update(revokedContent).digest('hex');
    const revokedStoragePath = `media/institutions/inst-fema/old_bulletin_2024.pdf`;
    this.storageFiles.set(revokedStoragePath, {
      buffer: revokedContent,
      mimeType: 'application/pdf',
      originalName: 'old_bulletin_2024.pdf',
    });
    const revokedSignature = await kmsProvider.signHash(credRevoked.id, revokedHash, 'RSA-PSS-SHA256');

    const mediaRevoked: MediaRecord = {
      id: 'rec-fema-revoked-002',
      institutionId: inst1.id,
      credentialId: credRevoked.id,
      mediaHash: revokedHash,
      mediaType: 'NOTICE',
      signature: revokedSignature,
      storagePath: revokedStoragePath,
      blockchainTxHash: null,
      status: 'SIGNED',
      createdAt: '2024-06-10T12:00:00.000Z',
      signedAt: '2024-06-10T12:02:00.000Z',
      originalFileName: 'old_bulletin_2024.pdf',
      fileSizeBytes: revokedContent.length,
      mimeType: 'application/pdf',
      title: 'Discontinued FEMA 2024 Guidelines (Signed with Revoked Key)',
    };
    this.mediaRecords.set(mediaRevoked.id, mediaRevoked);

    // Seed Sample 3: Pending/Unsigned Media Record
    const unsignedContent = Buffer.from('DRAFT NOAA Weather Radar Summary (Pending Director Signature)');
    const unsignedHash = crypto.createHash('sha256').update(unsignedContent).digest('hex');
    const unsignedStoragePath = `media/institutions/inst-noaa/radar_draft.mp4`;
    this.storageFiles.set(unsignedStoragePath, {
      buffer: unsignedContent,
      mimeType: 'video/mp4',
      originalName: 'radar_draft.mp4',
    });

    const mediaUnsigned: MediaRecord = {
      id: 'rec-noaa-003',
      institutionId: inst3.id,
      credentialId: '',
      mediaHash: unsignedHash,
      mediaType: 'VIDEO',
      signature: null,
      storagePath: unsignedStoragePath,
      blockchainTxHash: null,
      status: 'PENDING_SIGNATURE',
      createdAt: '2026-08-15T09:30:00.000Z',
      signedAt: null,
      originalFileName: 'radar_draft.mp4',
      fileSizeBytes: unsignedContent.length,
      mimeType: 'video/mp4',
      title: 'NOAA Radar Draft Video (Unsigned)',
    };
    this.mediaRecords.set(mediaUnsigned.id, mediaUnsigned);

    // Initial Verification Log
    this.verificationLogs.push({
      id: 'log-seed-001',
      mediaHash: femaHash,
      verdict: 'AUTHENTIC',
      deepfakeScore: 0.01,
      isSigned: true,
      issuerId: inst1.id,
      tamperDetected: false,
      checkedAt: '2026-08-16T06:00:00.000Z',
      details: 'Automated gateway health verification check succeeded.',
      institutionName: inst1.name,
      credentialStatus: 'ACTIVE',
    });
  }

  // Database helper methods
  public async getInstitution(id: string): Promise<Institution | null> {
    return this.institutions.get(id) || null;
  }

  public async listInstitutions(): Promise<Institution[]> {
    return Array.from(this.institutions.values());
  }

  public async createInstitution(inst: Omit<Institution, 'id'>): Promise<Institution> {
    const id = `inst-${Date.now()}`;
    const newInst: Institution = { ...inst, id };
    this.institutions.set(id, newInst);
    return newInst;
  }

  public async getCredential(id: string): Promise<Credential | null> {
    return this.credentials.get(id) || null;
  }

  public async listCredentials(institutionId?: string): Promise<Credential[]> {
    const all = Array.from(this.credentials.values());
    if (institutionId) {
      return all.filter((c) => c.institutionId === institutionId);
    }
    return all;
  }

  public async createCredential(cred: Omit<Credential, 'id'>): Promise<Credential> {
    const id = `cred-${Date.now()}`;
    const newCred: Credential = { ...cred, id };
    this.credentials.set(id, newCred);
    return newCred;
  }

  public async updateCredential(id: string, updates: Partial<Credential>): Promise<Credential> {
    const existing = this.credentials.get(id);
    if (!existing) {
      throw new Error(`Credential '${id}' not found`);
    }
    const updated: Credential = { ...existing, ...updates };
    this.credentials.set(id, updated);
    return updated;
  }

  public async getMediaRecord(id: string): Promise<MediaRecord | null> {
    return this.mediaRecords.get(id) || null;
  }

  public async findMediaRecordByHash(hash: string): Promise<MediaRecord | null> {
    const normalized = hash.toLowerCase();
    for (const record of this.mediaRecords.values()) {
      if (record.mediaHash.toLowerCase() === normalized) {
        return record;
      }
    }
    return null;
  }

  public async listMediaRecords(institutionId?: string): Promise<MediaRecord[]> {
    const all = Array.from(this.mediaRecords.values());
    if (institutionId) {
      return all.filter((r) => r.institutionId === institutionId);
    }
    return all;
  }

  public async createMediaRecord(record: Omit<MediaRecord, 'id'>): Promise<MediaRecord> {
    const id = `rec-${Date.now()}`;
    const newRecord: MediaRecord = { ...record, id };
    this.mediaRecords.set(id, newRecord);
    return newRecord;
  }

  public async updateMediaRecord(id: string, updates: Partial<MediaRecord>): Promise<MediaRecord> {
    const existing = this.mediaRecords.get(id);
    if (!existing) {
      throw new Error(`MediaRecord '${id}' not found`);
    }
    const updated: MediaRecord = { ...existing, ...updates };
    this.mediaRecords.set(id, updated);
    return updated;
  }

  public async createVerificationLog(log: Omit<VerificationLog, 'id'>): Promise<VerificationLog> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLog: VerificationLog = { ...log, id };
    this.verificationLogs.unshift(newLog);
    return newLog;
  }

  public async listVerificationLogs(limitCount = 100): Promise<VerificationLog[]> {
    return this.verificationLogs.slice(0, limitCount);
  }

  public async saveStorageFile(storagePath: string, buffer: Buffer, mimeType?: string, originalName?: string): Promise<string> {
    this.storageFiles.set(storagePath, {
      buffer,
      mimeType,
      originalName: originalName || path.basename(storagePath),
    });
    return storagePath;
  }

  public getStorageFile(storagePath: string) {
    return this.storageFiles.get(storagePath);
  }
}

export const db = InMemoryDB.getInstance();
