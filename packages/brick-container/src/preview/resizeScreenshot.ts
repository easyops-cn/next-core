export function resizeScreenshot(
  canvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): string {
  const targetRatio = maxWidth / maxHeight;
  const { width, height } = canvas;
  const ratio = width / height;
  const wider = ratio >= targetRatio;
  const finalWidth = wider ? maxWidth : maxHeight * ratio;
  const finalHeight = wider ? maxWidth / ratio : maxHeight;
  targetCanvas.width = finalWidth;
  targetCanvas.height = finalHeight;

  const ctx = targetCanvas.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, width, height, 0, 0, finalWidth, finalHeight);
  return targetCanvas.toDataURL();
}
