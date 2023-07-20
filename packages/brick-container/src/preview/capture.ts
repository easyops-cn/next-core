// istanbul ignore file: nothing logical except calling html2canvas.
import html2canvas from "html2canvas";
import { resizeScreenshot } from "./resizeScreenshot.js";

function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob: Blob | null) {
      if (blob) {
        resolve(blob);
      } else {
        reject();
      }
    });
  });
}

export async function capture(
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  const sourceCanvas = await html2canvas(document.body, {
    logging: false,
    scale: 1,
    width: window.innerWidth,
    height: window.innerHeight,
    foreignObjectRendering: true,
  });
  const targetCanvas = document.createElement("canvas");
  resizeScreenshot(sourceCanvas, targetCanvas, maxWidth, maxHeight);
  const blob = await getCanvasBlob(targetCanvas);
  return blob;
}
