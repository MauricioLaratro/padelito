import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
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
function buildSocialSvg(content, { width = 1080, height = 1350, format = "feed" } = {}) {
  const isStory = format === "story";
  const hookLines = wrapText(content.hook, isStory ? 17 : 19).slice(0, 3);
  const subheadLines = wrapText(content.subhead, isStory ? 30 : 34).slice(0, 3);
  const cardY = isStory ? 950 : 720;
  const detailStartY = isStory ? 1120 : 875;
  const ctaY = isStory ? 1698 : 1228;
  const siteY = isStory ? 1752 : 1278;
  const detailNodes = content.cardDetails
    .map((detail, index) => {
      const x = 116 + (index % 2) * 410;
      const y = detailStartY + Math.floor(index / 2) * 92;
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
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <path d="M0 ${height - 360} C260 ${height - 510} 512 ${height - 250} 1080 ${height - 430} L1080 ${height} L0 ${height} Z" fill="#14181E" opacity="0.92"/>
    <circle cx="876" cy="132" r="34" fill="#D7F21A"/>
    <circle cx="812" cy="132" r="16" fill="#D9D9D9"/>
    <circle cx="765" cy="132" r="16" fill="#D9D9D9"/>
    <circle cx="718" cy="132" r="16" fill="#D9D9D9"/>
    <text x="92" y="116" font-size="34" font-weight="900" fill="#D7F21A">Padelito</text>
    <text x="92" y="153" font-size="24" font-weight="700" fill="#A6A6A6">comunidad de padel en Posadas</text>
    ${hookText}
    ${subheadText}
    <text x="96" y="${isStory ? 690 : 650}" font-size="30" font-weight="900" fill="#D7F21A">La app para dejar de perseguir gente por WhatsApp</text>
    <g filter="url(#shadow)">
      <rect x="82" y="${cardY}" width="916" height="388" rx="34" fill="#15181D" stroke="rgba(217,217,217,0.12)" stroke-width="2"/>
      <rect x="116" y="${cardY + 46}" width="244" height="52" rx="26" fill="#D7F21A"/>
      <text x="146" y="${cardY + 81}" font-size="25" font-weight="900" fill="#0F1115">${escapeXml(content.cardTitle)}</text>
      ${detailNodes}
      <rect x="736" y="${cardY + 295}" width="188" height="56" rx="28" fill="#D7F21A"/>
      <text x="780" y="${cardY + 332}" font-size="24" font-weight="900" fill="#0F1115">Sumate</text>
    </g>
    <text x="92" y="${ctaY}" font-size="44" font-weight="900" fill="#F5F5F5">Entra al perfil y registrate</text>
    <text x="92" y="${siteY}" font-size="30" font-weight="800" fill="#D7F21A">${padelitoSocialChannels.siteUrl.replace("https://", "")}</text>
  </g>
</svg>`;
}

/**
 * Construye una escena vertical para video.
 * Existe para que cada Reel tenga varias placas y no sea una imagen estatica.
 */
function buildVideoSceneSvg(content, sceneIndex) {
  const scenes = [
    {
      eyebrow: "Situacion real",
      title: content.hook,
      body: content.subhead,
      accent: "Alguien siempre se baja a ultimo momento.",
      cardTitle: content.cardTitle,
      details: content.cardDetails,
    },
    {
      eyebrow: "El problema",
      title: "Coordinar no deberia costar tanto.",
      body: "Grupos largos, mensajes cruzados y nadie confirma a tiempo.",
      accent: "Padelito junta la movida en un solo lugar.",
      cardTitle: "Sin vueltas",
      details: ["Publica", "Filtra", "Solicita", "Juga"],
    },
    {
      eyebrow: "Como funciona",
      title: "Publicas el partido y aparecen jugadores.",
      body: "Nivel, posicion, horario y club para que se sumen personas compatibles.",
      accent: "Hecho para jugadores de Posadas.",
      cardTitle: "En la app",
      details: ["Nivel", "Zona", "Posicion", "Horario"],
    },
    {
      eyebrow: "Sumate ahora",
      title: "Si jugas padel en Posadas, registrate.",
      body: "Mientras mas jugadores haya, mas facil se arman partidos, practicas, mixtos y tercer tiempo.",
      accent: padelitoSocialChannels.siteUrl.replace("https://", ""),
      cardTitle: "Padelito",
      details: ["Partidos", "Practica", "Mixto", "Comunidad"],
    },
  ];
  const scene = scenes[sceneIndex % scenes.length];
  const titleLines = wrapText(scene.title, 18).slice(0, 4);
  const bodyLines = wrapText(scene.body, 31).slice(0, 4);
  const detailNodes = scene.details
    .map((detail, index) => {
      const x = 112 + (index % 2) * 420;
      const y = 1165 + Math.floor(index / 2) * 98;
      return `
        <rect x="${x}" y="${y}" width="348" height="60" rx="30" fill="#23262D" stroke="rgba(245,245,245,0.12)"/>
        <text x="${x + 30}" y="${y + 40}" font-size="28" font-weight="900" fill="#F5F5F5">${escapeXml(detail)}</text>`;
    })
    .join("");
  const titleText = titleLines
    .map(
      (line, index) =>
        `<text x="86" y="${304 + index * 82}" font-size="70" font-weight="900" fill="#F5F5F5">${escapeXml(line)}</text>`,
    )
    .join("");
  const bodyText = bodyLines
    .map(
      (line, index) =>
        `<text x="90" y="${730 + index * 46}" font-size="35" font-weight="800" fill="#B8BAC0">${escapeXml(line)}</text>`,
    )
    .join("");
  const courtOffset = sceneIndex * 130;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sceneGlow" cx="${sceneIndex % 2 === 0 ? "74%" : "18%"}" cy="18%" r="88%">
      <stop offset="0" stop-color="#2E3B05"/>
      <stop offset="0.44" stop-color="#101417"/>
      <stop offset="1" stop-color="#0D1014"/>
    </radialGradient>
    <filter id="sceneShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="26" stdDeviation="34" flood-color="#000000" flood-opacity="0.38"/>
    </filter>
  </defs>
  <rect width="1080" height="1920" fill="url(#sceneGlow)"/>
  <g opacity="0.28" stroke="#D7F21A" stroke-width="7" fill="none" transform="translate(${courtOffset - 220} 930) rotate(-12)">
    <rect x="0" y="0" width="1320" height="720" rx="18"/>
    <line x1="660" y1="0" x2="660" y2="720"/>
    <line x1="0" y1="360" x2="1320" y2="360"/>
    <line x1="330" y1="0" x2="330" y2="720"/>
    <line x1="990" y1="0" x2="990" y2="720"/>
  </g>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="86" y="112" font-size="34" font-weight="900" fill="#D7F21A">Padelito</text>
    <text x="86" y="154" font-size="24" font-weight="800" fill="#A6A6A6">comunidad de padel en Posadas</text>
    <rect x="86" y="204" width="300" height="54" rx="27" fill="#D7F21A"/>
    <text x="116" y="240" font-size="25" font-weight="900" fill="#0D1014">${escapeXml(scene.eyebrow)}</text>
    ${titleText}
    ${bodyText}
    <text x="90" y="965" font-size="34" font-weight="900" fill="#D7F21A">${escapeXml(scene.accent)}</text>
    <g filter="url(#sceneShadow)">
      <rect x="74" y="1054" width="932" height="374" rx="34" fill="#15181D" stroke="rgba(245,245,245,0.12)" stroke-width="2"/>
      <rect x="112" y="1100" width="390" height="58" rx="29" fill="#D7F21A"/>
      <text x="144" y="1138" font-size="26" font-weight="900" fill="#0D1014">${escapeXml(scene.cardTitle)}</text>
      ${detailNodes}
    </g>
    <text x="86" y="1686" font-size="50" font-weight="900" fill="#F5F5F5">Entra al perfil</text>
    <text x="86" y="1744" font-size="34" font-weight="900" fill="#D7F21A">registrate y carga tu nivel</text>
  </g>
</svg>`;
}

/**
 * Ejecuta ffmpeg para crear un reel con escenas y movimiento.
 * Existe para evitar publicar Reels estaticos y mantener el flujo 100% automatico.
 */
function renderReelVideo({ sceneImagePaths, videoPath }) {
  return new Promise((resolve) => {
    const inputArgs = sceneImagePaths.flatMap((sceneImagePath) => ["-loop", "1", "-t", "4", "-i", sceneImagePath]);
    const sceneFilters = sceneImagePaths
      .map((_, index) => {
        const zoomExpression = index % 2 === 0 ? "1+0.08*on/119" : "1.08-0.08*on/119";
        const panExpression = index % 2 === 0 ? "iw/2-(iw/zoom/2)+(on*0.45)" : "iw/2-(iw/zoom/2)-(on*0.45)";
        return `[${index}:v]scale=1188:2112,zoompan=z='${zoomExpression}':x='${panExpression}':y='ih/2-(ih/zoom/2)':d=120:s=1080x1920:fps=30,format=yuv420p[v${index}]`;
      })
      .join(";");
    const concatInputs = sceneImagePaths.map((_, index) => `[v${index}]`).join("");
    const filterComplex = `${sceneFilters};${concatInputs}concat=n=${sceneImagePaths.length}:v=1:a=0,format=yuv420p[v]`;
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      ...inputArgs,
      "-f",
      "lavfi",
      "-i",
      "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-filter_complex",
      filterComplex,
      "-map",
      "[v]",
      "-map",
      `${sceneImagePaths.length}:a`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-g",
      "60",
      "-t",
      "16",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      "-movflags",
      "+faststart",
      videoPath,
    ]);

    ffmpeg.on("error", () => resolve(false));
    ffmpeg.on("close", (code) => resolve(code === 0));
  });
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
  const storySvg = buildSocialSvg(content, { width: 1080, height: 1920, format: "story" });
  const svgPath = path.join(outputRoot, `${baseName}.svg`);
  const imagePath = path.join(outputRoot, `${baseName}.png`);
  const storySvgPath = path.join(outputRoot, `${baseName}-story.svg`);
  const storyImagePath = path.join(outputRoot, `${baseName}-story.png`);
  const videoPath = path.join(outputRoot, `${baseName}-reel.mp4`);
  const sceneSvgPaths = Array.from({ length: 4 }, (_, index) => path.join(outputRoot, `${baseName}-scene-${index + 1}.svg`));
  const sceneImagePaths = Array.from({ length: 4 }, (_, index) => path.join(outputRoot, `${baseName}-scene-${index + 1}.png`));
  const manifestPath = path.join(outputRoot, `${baseName}.json`);
  const publicMediaBaseUrl = (process.env.PUBLIC_MEDIA_BASE_URL || padelitoSocialChannels.siteUrl).replace(/\/$/, "");

  await mkdir(outputRoot, { recursive: true });
  await writeFile(svgPath, svg, "utf8");
  await writeFile(storySvgPath, storySvg, "utf8");
  await sharp(Buffer.from(svg)).png().toFile(imagePath);
  await sharp(Buffer.from(storySvg)).png().toFile(storyImagePath);
  await Promise.all(
    sceneSvgPaths.map(async (sceneSvgPath, index) => {
      const sceneSvg = buildVideoSceneSvg(content, index);
      await writeFile(sceneSvgPath, sceneSvg, "utf8");
      await sharp(Buffer.from(sceneSvg)).png().toFile(sceneImagePaths[index]);
    }),
  );

  const videoWasRendered = await renderReelVideo({ sceneImagePaths, videoPath });
  const manifest = {
    publicationDate,
    title: content.hook,
    caption,
    imagePath: `/social/generated/${baseName}.png`,
    imageUrl: `${publicMediaBaseUrl}/social/generated/${baseName}.png`,
    storyImagePath: `/social/generated/${baseName}-story.png`,
    storyImageUrl: `${publicMediaBaseUrl}/social/generated/${baseName}-story.png`,
    sceneImagePaths: sceneImagePaths.map((_, index) => `/social/generated/${baseName}-scene-${index + 1}.png`),
    svgPath: `/social/generated/${baseName}.svg`,
    storySvgPath: `/social/generated/${baseName}-story.svg`,
    sceneSvgPaths: sceneSvgPaths.map((_, index) => `/social/generated/${baseName}-scene-${index + 1}.svg`),
    videoPath: videoWasRendered ? `/social/generated/${baseName}-reel.mp4` : null,
    videoUrl: videoWasRendered ? `${publicMediaBaseUrl}/social/generated/${baseName}-reel.mp4` : null,
    siteUrl: padelitoSocialChannels.siteUrl,
    channels: {
      instagram: padelitoSocialChannels.instagramUsername,
      tiktok: padelitoSocialChannels.tiktokUsername,
    },
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(latestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
