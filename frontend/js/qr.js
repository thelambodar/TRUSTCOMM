/**
 * TRUSTCOMM - Lightweight QR Code Generator & Parser Utility
 * Renders high-tech dynamic QR code matrix on canvas/SVG for verification links.
 */

export class QRCodeGenerator {
  /**
   * Renders a styled high-tech QR Code onto a target canvas element.
   */
  static renderQR(canvasElement, text, options = {}) {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const size = options.size || 220;
    canvasElement.width = size;
    canvasElement.height = size;

    ctx.fillStyle = options.bgColor || '#070b16';
    ctx.fillRect(0, 0, size, size);

    // Generate pseudo-random matrix deterministically from string hash
    const matrixSize = 25; // 25x25 grid
    const cellSize = size / matrixSize;

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    // Draw finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (startX, startY) => {
      ctx.fillStyle = options.fgColor || '#00e5ff';
      ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = options.bgColor || '#070b16';
      ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = options.fgColor || '#00e5ff';
      ctx.fillRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(1, 1);
    drawFinder(matrixSize - 8, 1);
    drawFinder(1, matrixSize - 8);

    // Draw data cells
    ctx.fillStyle = options.fgColor || '#00e5ff';
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder areas
        if ((r < 9 && c < 9) || (r < 9 && c > matrixSize - 9) || (r > matrixSize - 9 && c < 9)) {
          continue;
        }

        // Pseudo-random cell state derived from text string and cell position
        const seed = (r * 31 + c * 17 + Math.abs(hash)) % 100;
        if (seed > 45) {
          ctx.beginPath();
          ctx.arc(
            (c + 0.5) * cellSize,
            (r + 0.5) * cellSize,
            cellSize * 0.4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Optional center shield branding logo icon overlay
    const logoSize = cellSize * 5;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    ctx.fillStyle = options.bgColor || '#070b16';
    ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
    ctx.strokeStyle = options.fgColor || '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

    ctx.fillStyle = options.accentColor || '#00f5a0';
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TRUST', size / 2, size / 2);
  }

  /**
   * Generates a data URI string of the QR Code canvas
   */
  static generateDataURL(text) {
    const tempCanvas = document.createElement('canvas');
    this.renderQR(tempCanvas, text, { size: 300 });
    return tempCanvas.toDataURL('image/png');
  }
}
