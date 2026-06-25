import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { dailyContentPlan, padelitoSocialChannels } from "./contentPlan.mjs";

const outputRoot = path.resolve("public", "social", "generated");
const latestPath = path.resolve("public", "social", "latest.json");

/**
 * Calcula que pieza corresponde publicar.
 * Existe para que el calendario sea repetible y no dependa de estado externo.
 */
function getDailyContentIndex(date = new Date()) {
  if (process.env.SOCIAL_CONTENT_INDEX) {
    return Number(process.env.SOCIAL_CONTENT_INDEX) % dailyContentPlan.length;
  }

  const startDate = new Date("2026-06-25T00:00:00-03:00");
  const elapsedDays = Math.floor((date.getTime() - startDate.getTime()) / 86_400_000);
  return Math.abs(elapsedDays) % dailyContentPlan.length;
}

/**
 * Divide texto largo en lineas visualmente estables.
 * Existe para mantener las piezas legibles en formato vertical.
 */
function wrapText(text, maxLength) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Escapa texto para insertarlo en SVG.
 * Existe para evitar que signos del copy rompan el render diario.
 */
function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Construye una plantilla visual de Padelito.
 * La usan las automatizaciones para generar una pieza diaria consistente.
 */
function buildSocialSvg(content) {
  const hookLines = wrapText(content.hook, 19).slice(0, 3);
  const subheadLines = wrapText(content.subhead, 34).slice(0, 3);
  const detailNodes = content.cardDetails
    .map((detail, index) => {
      const x = 116 + (index % 2) * 410;
      const y = 875 + Math.floor(index / 2) * 92;
      return `
        <rect x="${x}" y="${y}" width="342" height="54" rx="27" fill="#20242B" stroke="rgba(217,217,217,0.12)"/>
        <text x="${x + 28}" y="${y + 36}" font-size="26" font-weight="800" fill="#D9D9D9">${escapeXml(detail)}</text>`;
    })
    .join("");

  const hookText = hookLines
    .map(
      (line, index) =>
        `<text x="92" y="${258 + index * 82}" font-size="70" font-weight="900" fill="#F5F5F5">${escapeXml(line)}</text>`,
    )
    .join("");

  const subheadText = subheadLines
    .map(
      (line, index) =>
        `<text x="96" y="${525 + index * 44}" font-size="34" font-weight="700" fill="#A6A6A6">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="72%" cy="16%" r="78%">
      <stop offset="0" stop-color="#243004"/>
      <stop offset="0.38" stop-color="#101315"/>
      <stop offset="1" stop-color="#0F1115"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="36" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g font-family="Arial, Helvetica, sans-serif">
    <rect width="1080" height="1350" fill="url(#glow)"/>
    <circle cx="876" cy="132" r="34" fill="#D7F21A"/>
    <circle cx="812" cy="132" r="16" fill="#D9D9D9"/>
    <circle cx="765" cy="132" r="16" fill="#D9D9D9"/>
    <circle cx="718" cy="132" r="16" fill="#D9D9D9"/>
    <text x="92" y="116" font-size="34" font-weight="900" fill="#D7F21A">Padelito</text>
    <text x="92" y="153" font-size="24" font-weight="700" fill="#A6A6A6">comunidad de padel en Posadas</text>
    ${hookText}
    ${subheadText}
    <g filter="url(#shadow)">
      <rect x="82" y="720" width="916" height="388" rx="34" fill="#15181D" stroke="rgba(217,217,217,0.12)" stroke-width="2"/>
      <rect x="116" y="766" width="244" height="52" rx="26" fill="#D7F21A"/>
      <text x="146" y="801" font-size="25" font-weight="900" fill="#0F1115">${escapeXml(content.cardTitle)}</text>
      ${detailNodes}
      <rect x="736" y="1015" width="188" height="56" rx="28" fill="#D7F21A"/>
      <text x="780" y="1052" font-size="24" font-weight="900" fill="#0F1115">Sumate</text>
    </g>
    <text x="92" y="1228" font-size="34" font-weight="900" fill="#F5F5F5">Entra al perfil y registrate</text>
    <text x="92" y="1278" font-size="28" font-weight="800" fill="#D7F21A">${padelitoSocialChannels.siteUrl.replace("https://", "")}</text>
  </g>
</svg>`;
}

/**
 * Genera los archivos diarios que usa el publicador.
 * Tambien deja latest.json para inspeccion y ejecuciones locales.
 */
async function main() {
  const now = new Date();
  const publicationDate = process.env.SOCIAL_PUBLICATION_DATE || now.toISOString().slice(0, 10);
  const content = dailyContentPlan[getDailyContentIndex(now)];
  const caption = `${content.caption}\n\n${content.hashtags.join(" ")}`;
  const baseName = `padelito-${publicationDate}`;
  const svg = buildSocialSvg(content);
  const svgPath = path.join(outputRoot, `${baseName}.svg`);
  const imagePath = path.join(outputRoot, `${baseName}.png`);
  const manifestPath = path.join(outputRoot, `${baseName}.json`);
  const publicMediaBaseUrl = (process.env.PUBLIC_MEDIA_BASE_URL || padelitoSocialChannels.siteUrl).replace(/\/$/, "");
  const manifest = {
    publicationDate,
    title: content.hook,
    caption,
    imagePath: `/social/generated/${baseName}.png`,
    imageUrl: `${publicMediaBaseUrl}/social/generated/${baseName}.png`,
    svgPath: `/social/generated/${baseName}.svg`,
    siteUrl: padelitoSocialChannels.siteUrl,
    channels: {
      instagram: padelitoSocialChannels.instagramUsername,
      tiktok: padelitoSocialChannels.tiktokUsername,
    },
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg)).png().toFile(imagePath);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(latestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
