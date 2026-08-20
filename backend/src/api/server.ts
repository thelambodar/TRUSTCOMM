import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from '../database/db.js';
import {
  uploadMediaHandler,
  signMediaHandler,
  verifyMediaHandler,
  revokeCredentialHandler,
  CredentialService,
  kmsProvider,
} from '../index.js';
import { AuthContext } from '../auth/authService.js';
import { UserRole, MediaType } from '../types.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper to extract authentication context from headers or request body
  function extractAuthContext(req: express.Request): AuthContext {
    const roleHeader = (req.headers['x-user-role'] as UserRole) || (req.body?.authRole as UserRole) || 'PUBLIC_RECIPIENT';
    const institutionIdHeader = (req.headers['x-institution-id'] as string) || req.body?.authInstitutionId || undefined;
    const uidHeader = (req.headers['x-user-uid'] as string) || req.body?.authUid || 'user-public-001';
    const emailHeader = (req.headers['x-user-email'] as string) || req.body?.authEmail || 'public@recipient.org';

    return {
      uid: uidHeader,
      email: emailHeader,
      role: roleHeader,
      institutionId: institutionIdHeader,
    };
  }

  // ==========================================
  // 1. HEALTH & SYSTEM ARCHITECTURE
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Media Authenticity Verification Platform Backend',
      timestamp: new Date().toISOString(),
      firebaseCloudFunctions: ['uploadMedia', 'signMedia', 'verifyMedia', 'revokeCredential'],
      modularProviders: {
        kms: 'NodeCryptoKMSProvider (Google Cloud KMS Interface Ready)',
        deepfakeAi: 'CloudRunDeepfakeDetectorStub (PyTorch / Cloud Run Interface Ready)',
        blockchain: 'BlockchainProvenanceStub (Ethereum/Polygon Anchor Interface Ready)',
      },
    });
  });

  // ==========================================
  // 2. INSTITUTIONS API
  // ==========================================
  app.get('/api/institutions', async (req, res) => {
    try {
      const list = await db.listInstitutions();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/institutions', async (req, res) => {
    try {
      const auth = extractAuthContext(req);
      if (auth.role !== 'SYSTEM_ADMIN') {
        return res.status(403).json({ error: 'PERMISSION_DENIED: Only SYSTEM_ADMIN can create institutions.' });
      }

      const { name, domain, status } = req.body;
      if (!name || !domain) {
        return res.status(400).json({ error: 'INVALID_ARGUMENT: Name and domain are required.' });
      }

      const newInst = await db.createInstitution({
        name,
        domain,
        status: status || 'ACTIVE',
        createdAt: new Date().toISOString(),
      });

      // Auto issue a default credential for new institutions
      const cred = await CredentialService.issueCredential(
        auth,
        { institutionId: newInst.id, keyAlgorithm: 'RSA-PSS-SHA256' },
        (c) => db.createCredential(c)
      );

      res.status(201).json({ institution: newInst, credential: cred });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 3. CREDENTIALS API (Issue & Revoke)
  // ==========================================
  app.get('/api/credentials', async (req, res) => {
    try {
      const institutionId = req.query.institutionId as string | undefined;
      const list = await db.listCredentials(institutionId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/credentials', async (req, res) => {
    try {
      const auth = extractAuthContext(req);
      const { institutionId, keyAlgorithm } = req.body;
      if (!institutionId) {
        return res.status(400).json({ error: 'INVALID_ARGUMENT: institutionId is required' });
      }

      const cred = await CredentialService.issueCredential(
        auth,
        { institutionId, keyAlgorithm: keyAlgorithm || 'RSA-PSS-SHA256' },
        (c) => db.createCredential(c)
      );
      res.status(201).json(cred);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Cloud Function: revokeCredential
   * Only SYSTEM_ADMIN can revoke credentials
   */
  app.post('/api/credentials/revoke', async (req, res) => {
    try {
      const auth = extractAuthContext(req);
      const { credentialId, revocationReason } = req.body;

      const revoked = await revokeCredentialHandler(
        auth,
        { credentialId, revocationReason },
        {
          getCredentialById: (id) => db.getCredential(id),
          updateCredential: (id, updates) => db.updateCredential(id, updates),
        }
      );

      res.json({
        success: true,
        message: `Credential '${credentialId}' has been revoked successfully.`,
        credential: revoked,
      });
    } catch (err: any) {
      const isForbidden = err.message.includes('PERMISSION_DENIED');
      const isNotFound = err.message.includes('NOT_FOUND');
      res.status(isForbidden ? 403 : isNotFound ? 404 : 400).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. MEDIA UPLOAD (Cloud Function: uploadMedia)
  // ==========================================
  app.post('/api/media/upload', upload.single('file'), async (req, res) => {
    try {
      const auth = extractAuthContext(req);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'INVALID_ARGUMENT: No media file uploaded.' });
      }

      const institutionId = req.body.institutionId || auth.institutionId;
      const mediaType = (req.body.mediaType || 'NOTICE') as MediaType;
      const credentialId = req.body.credentialId;
      const title = req.body.title || file.originalname;

      if (!institutionId) {
        return res.status(400).json({ error: 'INVALID_ARGUMENT: institutionId is required.' });
      }

      // Execute uploadMedia Cloud Function
      const record = await uploadMediaHandler(
        auth,
        {
          institutionId,
          credentialId,
          mediaType,
          fileName: file.originalname,
          fileBuffer: file.buffer,
          mimeType: file.mimetype,
          title,
        },
        async (storagePath, buffer, mime) => {
          return await db.saveStorageFile(storagePath, buffer, mime, file.originalname);
        },
        {
          createMediaRecord: (r) => db.createMediaRecord(r),
        }
      );

      res.status(201).json(record);
    } catch (err: any) {
      const isForbidden = err.message.includes('PERMISSION_DENIED');
      res.status(isForbidden ? 403 : 400).json({ error: err.message });
    }
  });

  // ==========================================
  // 5. MEDIA SIGNING (Cloud Function: signMedia)
  // ==========================================
  app.post('/api/media/sign', async (req, res) => {
    try {
      const auth = extractAuthContext(req);
      const { mediaRecordId, mediaHash, credentialId, institutionId } = req.body;

      if (!credentialId || !institutionId || (!mediaRecordId && !mediaHash)) {
        return res.status(400).json({
          error: 'INVALID_ARGUMENT: credentialId, institutionId, and (mediaRecordId or mediaHash) are required.',
        });
      }

      const signResult = await signMediaHandler(
        auth,
        {
          mediaRecordId,
          mediaHash,
          credentialId,
          institutionId,
        },
        {
          getCredentialById: (id) => db.getCredential(id),
          getMediaRecord: async (idOrHash) => {
            const byId = await db.getMediaRecord(idOrHash);
            if (byId) return byId;
            return await db.findMediaRecordByHash(idOrHash);
          },
          updateMediaRecord: (id, updates) => db.updateMediaRecord(id, updates),
        }
      );

      res.json({
        success: true,
        ...signResult,
      });
    } catch (err: any) {
      const isForbidden = err.message.includes('PERMISSION_DENIED');
      const isPrecondition = err.message.includes('FAILED_PRECONDITION');
      res.status(isForbidden ? 403 : isPrecondition ? 412 : 400).json({ error: err.message });
    }
  });

  // ==========================================
  // 6. MEDIA VERIFICATION (Cloud Function: verifyMedia)
  // ==========================================
  app.post('/api/media/verify', upload.single('file'), async (req, res) => {
    try {
      let hashToVerify = req.body.mediaHash;

      // If user uploaded a physical file directly to the verification endpoint, calculate SHA-256
      if (req.file) {
        hashToVerify = (await import('crypto')).createHash('sha256').update(req.file.buffer).digest('hex');
      }

      if (!hashToVerify) {
        return res.status(400).json({ error: 'INVALID_ARGUMENT: mediaHash or file is required for verification.' });
      }

      const verificationResult = await verifyMediaHandler(
        { mediaHash: hashToVerify },
        {
          findMediaRecordByHash: (hash) => db.findMediaRecordByHash(hash),
          getCredentialById: (id) => db.getCredential(id),
          getInstitutionById: (id) => db.getInstitution(id),
          createVerificationLog: (log) => db.createVerificationLog(log),
        }
      );

      res.json(verificationResult);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // 7. MEDIA RECORDS & STORAGE QUERY
  // ==========================================
  app.get('/api/media', async (req, res) => {
    try {
      const institutionId = req.query.institutionId as string | undefined;
      const records = await db.listMediaRecords(institutionId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/media/:id', async (req, res) => {
    try {
      const record = await db.getMediaRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ error: 'Media record not found.' });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Storage file retrieval
  app.get('/api/storage/*', (req, res) => {
    const storagePath = (req.params as any)[0];
    const file = db.getStorageFile(storagePath);
    if (!file) {
      return res.status(404).send('File not found in Cloud Storage bucket');
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.send(file.buffer);
  });

  // Verification audit logs
  app.get('/api/verification-logs', async (req, res) => {
    try {
      const logs = await db.listVerificationLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 8. VITE MIDDLEWARE SETUP
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Media Authenticity Verification Server running on port ${PORT}`);
  });
}

startServer();
