import { CanvasTexture, SRGBColorSpace } from "three";

export function createInstrumentTexture(kind: "driver" | "centre") {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 460;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Instrument canvas unavailable");
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  if (kind === "driver") {
    for (const [x, label, maximum] of [[280, "km/h", 260], [920, "rpm x1000", 8]] as const) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#52575a";
      ctx.beginPath();
      ctx.arc(x, 225, 156, Math.PI * .75, Math.PI * 2.25);
      ctx.stroke();
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * (.75 + i / 8 * 1.5);
        ctx.strokeStyle = "#b8bec1";
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 140, 225 + Math.sin(a) * 140);
        ctx.lineTo(x + Math.cos(a) * 153, 225 + Math.sin(a) * 153);
        ctx.stroke();
        if (i % 2 === 0) {
          ctx.font = "22px sans-serif";
          ctx.fillStyle = "#a5abad";
          ctx.fillText(String(Math.round(maximum * i / 8)), x + Math.cos(a) * 113, 233 + Math.sin(a) * 113);
        }
      }
      ctx.fillStyle = "#f0f2f3";
      ctx.font = "70px sans-serif";
      ctx.fillText("0", x, 250);
      ctx.fillStyle = "#b8bec1";
      ctx.font = "22px sans-serif";
      ctx.fillText(label, x, 292);
    }
    ctx.fillStyle = "#f0f2f3";
    ctx.font = "58px sans-serif";
    ctx.fillText("P", 600, 234);
    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#9ba1a4";
    ctx.fillText("PARKED", 600, 278);
  } else {
    ctx.fillStyle = "#edeff0";
    ctx.font = "42px sans-serif";
    ctx.fillText("M MONOGRAM", 600, 184);
    ctx.fillStyle = "#b59a65";
    ctx.fillRect(470, 216, 260, 2);
    ctx.fillStyle = "#929a9e";
    ctx.font = "25px sans-serif";
    ctx.fillText("ICONIC", 600, 263);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
