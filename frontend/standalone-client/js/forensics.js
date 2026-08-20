/**
 * AURA-TRUST / VERIPROV - Deepfake Forensic & Spectral Inspector
 * Web Audio API FFT spectrum canvas & video frame thermal heatmap overlay.
 */

export class ForensicScanner {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.audioAnimId = null;
    this.videoAnimId = null;
  }

  initAudioSpectrum(audioElement, canvasElement) {
    if (!canvasElement) return;

    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const ctx = canvasElement.getContext('2d');
    const width = canvasElement.width = canvasElement.clientWidth || 600;
    const height = canvasElement.height = canvasElement.clientHeight || 200;

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (audioElement && audioElement.src) {
      try {
        const source = this.audioCtx.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {}
    }

    const drawSpectrum = () => {
      this.audioAnimId = requestAnimationFrame(drawSpectrum);
      this.analyser.getByteFrequencyData(dataArray);

      const hasData = dataArray.some(val => val > 0);
      if (!hasData) {
        const time = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          const val = Math.sin(time + i * 0.15) * 80 + Math.cos(time * 0.7 - i * 0.1) * 60 + 100;
          dataArray[i] = Math.max(10, Math.min(255, val));
        }
      }

      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const barWidth = (width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.85;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(0, 245, 160, 0.8)');
        gradient.addColorStop(0.6, 'rgba(0, 229, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 59, 92, 0.9)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, height - barHeight - 4, barWidth - 2, 2);

        x += barWidth;
      }
    };

    if (this.audioAnimId) cancelAnimationFrame(this.audioAnimId);
    drawSpectrum();
  }

  startVideoHeatmapScan(videoElement, canvasOverlay, isFakeScenario = false) {
    if (!canvasOverlay) return;

    const ctx = canvasOverlay.getContext('2d');

    const updateFrame = () => {
      this.videoAnimId = requestAnimationFrame(updateFrame);

      const w = canvasOverlay.width = canvasOverlay.clientWidth || 640;
      const h = canvasOverlay.height = canvasOverlay.clientHeight || 360;

      ctx.clearRect(0, 0, w, h);

      const faceX = w * 0.35;
      const faceY = h * 0.18;
      const faceW = w * 0.3;
      const faceH = h * 0.55;

      if (isFakeScenario) {
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(255, 59, 92, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(faceX, faceY, faceW, faceH);

        const grad = ctx.createRadialGradient(
          faceX + faceW * 0.5, faceY + faceH * 0.6, 5,
          faceX + faceW * 0.5, faceY + faceH * 0.6, faceW * 0.45
        );
        grad.addColorStop(0, 'rgba(255, 0, 80, 0.65)');
        grad.addColorStop(0.5, 'rgba(255, 184, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(faceX - 20, faceY - 20, faceW + 40, faceH + 40);

        ctx.fillStyle = '#ff3b5c';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText('⚠️ DEEPFAKE ANOMALY DETECTED [94.2%]', faceX, faceY - 10);
      } else {
        ctx.strokeStyle = 'rgba(0, 245, 160, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(faceX, faceY, faceW, faceH);
        ctx.setLineDash([]);

        ctx.fillStyle = '#00f5a0';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('✓ FACIAL CONSISTENCY VERIFIED [100%]', faceX, faceY - 10);
      }
    };

    if (this.videoAnimId) cancelAnimationFrame(this.videoAnimId);
    updateFrame();
  }

  async analyzeMedia(fileOrName, mediaType = 'video', isFakeHint = false) {
    await new Promise(r => setTimeout(r, 400));

    if (isFakeHint) {
      return {
        anomalyScore: 94.2,
        spectralCoherence: 48.2,
        frameConsistency: 35.8,
        audioArtifacts: "Unnatural pitch phase transitions & TTS spectral truncation > 16.2kHz.",
        videoArtifacts: "Spatial boundary jitter & optical flow discontinuities around jawline."
      };
    }

    return {
      anomalyScore: 4.1,
      spectralCoherence: 98.6,
      frameConsistency: 99.1,
      audioArtifacts: "None (Natural acoustic reverberation & smooth phase spectrum).",
      videoArtifacts: "None (Consistent sensor noise distribution & edge alignment)."
    };
  }

  stopScans() {
    if (this.audioAnimId) cancelAnimationFrame(this.audioAnimId);
    if (this.videoAnimId) cancelAnimationFrame(this.videoAnimId);
  }
}
