import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");

function iconSvg({ padding }: { padding: number }) {
  const size = 512;
  const glyphScale = 1 - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const half = (size * glyphScale) / 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="0.55" stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>
  <path d="M ${cx} ${cy - half}
           L ${cx + half} ${cy - half * 0.15}
           V ${cy + half}
           A ${size * 0.03} ${size * 0.03} 0 0 1 ${cx + half - size * 0.03} ${cy + half + size * 0.03}
           H ${cx + half * 0.28}
           V ${cy + half * 0.05}
           H ${cx - half * 0.28}
           V ${cy + half + size * 0.03}
           H ${cx - half + size * 0.03}
           A ${size * 0.03} ${size * 0.03} 0 0 1 ${cx - half} ${cy + half}
           V ${cy - half * 0.15}
           Z"
        fill="white"/>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const standard = Buffer.from(iconSvg({ padding: 0.14 }));
  const maskable = Buffer.from(iconSvg({ padding: 0.22 }));

  await Promise.all([
    sharp(standard).resize(192, 192).png().toFile(path.join(OUT_DIR, "icon-192.png")),
    sharp(standard).resize(512, 512).png().toFile(path.join(OUT_DIR, "icon-512.png")),
    sharp(maskable).resize(512, 512).png().toFile(path.join(OUT_DIR, "icon-maskable-512.png")),
    sharp(standard).resize(180, 180).png().toFile(path.join(OUT_DIR, "apple-touch-icon.png")),
  ]);

  await writeFile(path.join(process.cwd(), "app", "icon.svg"), iconSvg({ padding: 0.14 }));

  console.log("Generated app icons in public/icons and app/icon.svg");
}

main().catch((error) => {
  console.error("Icon generation failed:", error);
  process.exit(1);
});
