/**
 * AURA-TRUST / VERIPROV - Main Application Controller
 * Orchestrates UI tabs, file inspection, verification workflow,
 * publisher studio, revocation ledger, interactive demo scenarios,
 * and high-tech dynamic cyber background canvas.
 */

import { CryptoEngine } from './crypto.js';
import { C2PAManifestManager, VERDICT_STATES } from './c2pa.js';
import { ForensicScanner } from './forensics.js';

class TechBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 55;
    this.animId = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1.5,
        color: Math.random() > 0.3 ? '#00e5ff' : '#7000ff',
        pulse: Math.random() * Math.PI * 2
      });
    }

    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  animate() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const time = Date.now() * 0.002;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.25;
          this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();

          if (dist < 90 && Math.sin(time + i + j) > 0.8) {
            const progress = (Math.sin(time * 2 + i) + 1) / 2;
            const px = p1.x + (p2.x - p1.x) * progress;
            const py = p1.y + (p2.y - p1.y) * progress;

            this.ctx.fillStyle = '#00f5a0';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
      }
    }

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      p.pulse += 0.03;
      const glow = Math.sin(p.pulse) * 1.5 + 2.5;

      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

class App {
  constructor() {
    this.c2paManager = new C2PAManifestManager();
    this.forensics = new ForensicScanner();
    this.techBg = new TechBackground('techBgCanvas');
    this.currentKeypair = null;
    this.currentManifest = null;
    this.currentFile = null;

    this.init();
  }

  async init() {
    this.setupTabs();
    this.setupDropzone();
    this.setupPublisherForm();
    this.setupRevocationModal();
    this.renderRevocationTable();

    this.currentKeypair = await CryptoEngine.generateKeypair();

    window.loadDemoScenario = (type) => this.loadDemoScenario(type);
    window.closeRevokeModal = () => this.closeRevokeModal();

    this.loadDemoScenario('authentic-video');

    this.showToast('System Initialized', 'AURA-TRUST Cryptographic Engine Ready.', 'info');
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.getAttribute('data-tab');
        document.querySelectorAll('.view-content').forEach(view => {
          view.classList.remove('active');
        });

        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');
      });
    });

    const toggleJsonBtn = document.getElementById('toggleJsonBtn');
    const jsonContainer = document.getElementById('jsonViewerContainer');
    if (toggleJsonBtn && jsonContainer) {
      toggleJsonBtn.addEventListener('click', () => {
        const isHidden = jsonContainer.style.display === 'none';
        jsonContainer.style.display = isHidden ? 'block' : 'none';
        toggleJsonBtn.innerHTML = isHidden 
          ? '<i class="fa-solid fa-eye-slash"></i> Hide Raw Manifest'
          : '<i class="fa-solid fa-code"></i> View Raw Manifest';
      });
    }
  }

  setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) this.handleFileSelect(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleFileSelect(e.target.files[0]);
    });
  }

  async handleFileSelect(file) {
    this.currentFile = file;
    const arrayBuffer = await file.arrayBuffer();
    const contentHash = await CryptoEngine.hashData(arrayBuffer);

    this.showToast('File Ingested', `Ingested: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');

    if (file.name.endsWith('.json') || file.type === 'application/json') {
      try {
        const text = new TextDecoder().decode(arrayBuffer);
        const manifestJson = JSON.parse(text);
        this.runVerificationPipeline(manifestJson, contentHash, file.name);
        return;
      } catch (err) {}
    }

    this.runVerificationPipeline(null, contentHash, file.name, file.type);
  }

  async runVerificationPipeline(manifest, contentHash, fileName, mimeType = '') {
    this.forensics.stopScans();

    const previewViewport = document.getElementById('previewViewport');
    const videoElement = document.getElementById('videoElement');
    const imageElement = document.getElementById('imageElement');
    const audioElement = document.getElementById('audioElement');
    const audioPreviewBox = document.getElementById('audioPreviewBox');
    const overlayCanvas = document.getElementById('videoOverlayCanvas');
    const audioCanvas = document.getElementById('audioSpectrumCanvas');

    previewViewport.style.display = 'block';
    videoElement.style.display = 'none';
    imageElement.style.display = 'none';
    audioPreviewBox.style.display = 'none';

    let mediaCategory = 'doc';
    if (mimeType.startsWith('video') || fileName.match(/\.(mp4|webm|mov)$/i)) mediaCategory = 'video';
    else if (mimeType.startsWith('audio') || fileName.match(/\.(mp3|wav|ogg)$/i)) mediaCategory = 'audio';
    else if (mimeType.startsWith('image') || fileName.match(/\.(png|jpg|jpeg)$/i)) mediaCategory = 'image';

    const isFakeScenario = manifest?.isFakeScenario || false;
    const forensicResult = await this.forensics.analyzeMedia(fileName, mediaCategory, isFakeScenario);

    if (mediaCategory === 'video') {
      videoElement.style.display = 'block';
      videoElement.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      videoElement.muted = true;
      videoElement.play().catch(() => {});
      this.forensics.startVideoHeatmapScan(videoElement, overlayCanvas, isFakeScenario);
    } else if (mediaCategory === 'audio') {
      audioPreviewBox.style.display = 'block';
      audioElement.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      audioElement.play().catch(() => {});
      this.forensics.initAudioSpectrum(audioElement, audioCanvas);
    } else {
      imageElement.style.display = 'block';
      imageElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320"><rect width="600" height="320" fill="%230b1329"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%2300e5ff" font-family="sans-serif" font-size="20" font-weight="bold">OFFICIAL EMERGENCY NOTICE DOCUMENT</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">Cryptographic Hash Digest Verified</text></svg>';
    }

    const verification = await this.c2paManager.verifyManifest(
      manifest,
      contentHash,
      forensicResult.anomalyScore
    );

    this.renderVerdict(verification, contentHash, manifest, forensicResult);
  }

  renderVerdict(verification, contentHash, manifest, forensicResult) {
    const verdictContainer = document.getElementById('verdictContainer');
    const specPublisher = document.getElementById('specPublisher');
    const specKeyId = document.getElementById('specKeyId');
    const specRevocation = document.getElementById('specRevocation');
    const specHash = document.getElementById('specHash');
    const specDeepfake = document.getElementById('specDeepfake');
    const specZk = document.getElementById('specZk');
    const jsonCodeBox = document.getElementById('jsonCodeBox');

    const state = verification.verdictState;

    if (state === VERDICT_STATES.AUTHENTIC) {
      verdictContainer.innerHTML = `
        <div class="verdict-card state-authentic">
          <div class="verdict-icon">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="verdict-body">
            <span class="badge badge-success">State: 🟢 VERIFIED AUTHENTIC</span>
            <h3 style="color: var(--color-authentic); margin-top:6px;">Cryptographically Signed & Authentic</h3>
            <p>${verification.reason}</p>
          </div>
        </div>
      `;
    } else if (state === VERDICT_STATES.UNSIGNED) {
      verdictContainer.innerHTML = `
        <div class="verdict-card state-unsigned">
          <div class="verdict-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="verdict-body">
            <span class="badge badge-warning">State: 🟡 UNSIGNED CONTENT</span>
            <h3 style="color: var(--color-unsigned); margin-top:6px;">Unverified / Missing Provenance</h3>
            <p>${verification.reason}</p>
          </div>
        </div>
      `;
    } else {
      verdictContainer.innerHTML = `
        <div class="verdict-card state-fake">
          <div class="verdict-icon">
            <i class="fa-solid fa-skull-crossbones"></i>
          </div>
          <div class="verdict-body">
            <span class="badge badge-danger">State: 🔴 PROVEN FAKE / TAMPERED</span>
            <h3 style="color: var(--color-fake); margin-top:6px;">Manipulation or Revoked Credential Alert</h3>
            <p>${verification.reason}</p>
          </div>
        </div>
      `;
    }

    specPublisher.textContent = verification.details?.publisher || manifest?.claim?.assertions?.find(a=>a.label==='c2pa.identity.publisher')?.data?.name || "Unsigned / Unknown";
    specKeyId.textContent = verification.details?.keyId || manifest?.claim?.assertions?.find(a=>a.label==='c2pa.identity.publisher')?.data?.keyId || "N/A";
    
    if (verification.keyRevoked) {
      specRevocation.innerHTML = `<span style="color: var(--color-fake); font-weight:bold;">REVOKED (${verification.revocationEntry?.revocationTimestamp})</span>`;
    } else {
      specRevocation.innerHTML = `<span style="color: var(--color-authentic);">ACTIVE (Not Revoked)</span>`;
    }

    specHash.textContent = contentHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    const score = forensicResult.anomalyScore;
    if (score > 50) {
      specDeepfake.innerHTML = `<span style="color: var(--color-fake); font-weight:bold;">${score}% (FAIL - AI Manipulated)</span>`;
    } else {
      specDeepfake.innerHTML = `<span style="color: var(--color-authentic);">${score}% (PASS - Clean)</span>`;
    }

    const hasZk = verification.details?.hasZkRedaction || manifest?.claim?.assertions?.some(a=>a.label==='c2pa.privacy.zk_commitment');
    specZk.textContent = hasZk ? "Zero-Knowledge Salted Commitment Active" : "Public Manifest (No ZK Redaction)";

    jsonCodeBox.textContent = JSON.stringify(manifest || { note: "No C2PA Manifest Attached" }, null, 2);
  }

  setupPublisherForm() {
    const signingForm = document.getElementById('signingForm');
    const btnGenNewKey = document.getElementById('btnGenNewKey');

    if (btnGenNewKey) {
      btnGenNewKey.addEventListener('click', async () => {
        this.currentKeypair = await CryptoEngine.generateKeypair();
        this.showToast('Keypair Generated', `New ECDSA Key ID: ${this.currentKeypair.keyId}`, 'info');
      });
    }

    if (signingForm) {
      signingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const authId = document.getElementById('signerAuthoritySelect').value;
        const title = document.getElementById('signerTitle').value;
        const payload = document.getElementById('signerPayload').value;
        const isZkRedacted = document.getElementById('zkRedactToggle').checked;

        const authorityObj = this.c2paManager.registeredAuthorities.find(a => a.id === authId) || {
          name: "National Emergency Management Agency",
          domain: "emergency.gov.org"
        };

        const contentHash = await CryptoEngine.hashText(payload);

        this.currentManifest = await this.c2paManager.createManifest({
          title,
          contentType: "text/plain",
          contentHash,
          authority: authorityObj,
          privateKey: this.currentKeypair.privateKey,
          publicKeyJwk: this.currentKeypair.publicKeyJwk,
          keyId: this.currentKeypair.keyId,
          privacySettings: { isZkRedacted, redactedFields: ["responder_gps_coordinates"] }
        });

        const signedResultBox = document.getElementById('signedResultBox');
        const signedJsonDisplay = document.getElementById('signedJsonDisplay');

        signedResultBox.style.display = 'block';
        signedJsonDisplay.textContent = JSON.stringify(this.currentManifest, null, 2);

        this.showToast('Manifest Signed', 'C2PA JUMBF Manifest created & signed.', 'success');
      });
    }

    const btnDownloadManifest = document.getElementById('btnDownloadManifest');
    if (btnDownloadManifest) {
      btnDownloadManifest.addEventListener('click', () => {
        if (!this.currentManifest) return;
        const blob = new Blob([JSON.stringify(this.currentManifest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `c2pa_manifest_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  setupRevocationModal() {
    const btnOpenRevokeModal = document.getElementById('btnOpenRevokeModal');
    const revokeModal = document.getElementById('revokeModal');
    const revokeKeyForm = document.getElementById('revokeKeyForm');

    if (btnOpenRevokeModal && revokeModal) {
      btnOpenRevokeModal.addEventListener('click', () => {
        revokeModal.classList.add('active');
      });
    }

    if (revokeKeyForm) {
      revokeKeyForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const keyId = document.getElementById('revokeKeyId').value.trim();
        const authorityName = document.getElementById('revokeAuthorityName').value.trim();
        const reason = document.getElementById('revokeReason').value.trim();

        this.c2paManager.revokeKey(keyId, authorityName, reason);
        this.renderRevocationTable();
        this.closeRevokeModal();

        this.showToast('Key Revoked', `Credential ${keyId} placed on Revocation Ledger.`, 'danger');
      });
    }
  }

  closeRevokeModal() {
    const revokeModal = document.getElementById('revokeModal');
    if (revokeModal) revokeModal.classList.remove('active');
  }

  renderRevocationTable() {
    const tbody = document.getElementById('revocationTableBody');
    const headerCount = document.getElementById('revokedKeyCount');
    const headerPill = document.getElementById('headerRevokedCount');

    if (!tbody) return;

    const ledger = this.c2paManager.revocationLedger;
    if (headerCount) headerCount.textContent = ledger.length;
    if (headerPill) headerPill.style.display = ledger.length > 0 ? 'flex' : 'none';

    tbody.innerHTML = ledger.map(item => `
      <tr>
        <td><code style="color: var(--color-fake); font-weight:700;">${item.keyId}</code></td>
        <td>${item.authorityName}</td>
        <td>${new Date(item.revocationTimestamp).toLocaleString()}</td>
        <td style="color: var(--text-muted);">${item.reason}</td>
        <td><span class="badge badge-danger">REVOKED / COMPROMISED</span></td>
      </tr>
    `).join('');
  }

  async loadDemoScenario(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="tab-verify"]').classList.add('active');
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-verify').classList.add('active');

    const mockHash = "a48f902c81d39b819f712c980f81d4a0918f7a91283e1c2b9a71649182394c81";

    if (type === 'authentic-video') {
      const manifest = await this.c2paManager.createManifest({
        title: "Official Mayor Severe Weather Update",
        contentType: "video/mp4",
        contentHash: mockHash,
        authority: { name: "Mayor Executive Communications Office", domain: "cityhall.gov.org" },
        privateKey: this.currentKeypair.privateKey,
        publicKeyJwk: this.currentKeypair.publicKeyJwk,
        keyId: "KEY-99A82C7410"
      });

      this.runVerificationPipeline(manifest, mockHash, "mayor_emergency_broadcast.mp4", "video/mp4");
      this.showToast('Demo Loaded', '🟢 Scenario: Authentic Official Video Broadcast.', 'success');

    } else if (type === 'deepfake-audio') {
      const manifest = await this.c2paManager.createManifest({
        title: "Synthesized Press Statement",
        contentType: "audio/mp3",
        contentHash: mockHash,
        authority: { name: "Central Financial Authority Press Office", domain: "fin-press.gov.org" },
        privateKey: this.currentKeypair.privateKey,
        publicKeyJwk: this.currentKeypair.publicKeyJwk,
        keyId: "KEY-3E901F29DA"
      });
      manifest.isFakeScenario = true;

      this.runVerificationPipeline(manifest, mockHash, "synthetic_voice_clone.mp3", "audio/mp3");
      this.showToast('Demo Loaded', '🔴 Scenario: AI Synthesized Voice Clone.', 'danger');

    } else if (type === 'unsigned-doc') {
      this.runVerificationPipeline(null, mockHash, "leaked_notice_draft.pdf", "application/pdf");
      this.showToast('Demo Loaded', '🟡 Scenario: Unsigned Content Notice.', 'warning');

    } else if (type === 'revoked-key') {
      const manifest = await this.c2paManager.createManifest({
        title: "Compromised Order Broadcast",
        contentType: "video/mp4",
        contentHash: mockHash,
        authority: { name: "Compromised Regional Alert Bureau", domain: "alert-bureau.org" },
        privateKey: this.currentKeypair.privateKey,
        publicKeyJwk: this.currentKeypair.publicKeyJwk,
        keyId: "KEY-REVOKED-HACKED-009"
      });

      this.runVerificationPipeline(manifest, mockHash, "revoked_credential_order.mp4", "video/mp4");
      this.showToast('Demo Loaded', '🔴 Scenario: Signed with Compromised Key.', 'danger');
    }
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-skull-crossbones';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="font-size: 1.2rem; color: var(--color-${type === 'info' ? 'primary' : type === 'success' ? 'authentic' : type === 'danger' ? 'fake' : 'unsigned'})"></i>
      <div>
        <strong style="display:block; font-size:0.86rem; color:#fff;">${title}</strong>
        <span style="font-size:0.78rem; color: var(--text-muted);">${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
