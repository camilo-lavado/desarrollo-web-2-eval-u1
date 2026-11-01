#!/usr/bin/env node
/**
 * scripts/render-diagramas.mjs
 *
 * Pre-renderiza todos los archivos .mmd de web/diagrams/ a archivos SVG
 * estáticos en web/public/diagramas/<ID>.svg usando Mermaid (web/node_modules/mermaid)
 * y Chrome/Edge headless local, garantizando etiquetas de flechas (.edgeLabel)
 * con color #16302B sobre fondo #FFFFFF y dimensiones intrínsecas width/height
 * para que <img src="/diagramas/Dxx.svg"> se vea en cualquier navegador y en Vercel.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIAGRAMS_DIR = path.join(ROOT_DIR, 'web', 'diagrams');
const OUT_DIR = path.join(ROOT_DIR, 'web', 'public', 'diagramas');
const MERMAID_JS = path.join(ROOT_DIR, 'web', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

fs.mkdirSync(OUT_DIR, { recursive: true });

const mmdFiles = fs
  .readdirSync(DIAGRAMS_DIR)
  .filter((f) => f.endsWith('.mmd'))
  .sort();

const diagrams = mmdFiles.map((file) => {
  const idMatch = file.match(/^(D\d+)/i);
  const id = idMatch ? idMatch[1].toUpperCase() : file.replace(/\.mmd$/, '');
  const code = fs.readFileSync(path.join(DIAGRAMS_DIR, file), 'utf8').trim();
  return { id, file, code };
});

const browserCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const browserBin = browserCandidates.find((p) => fs.existsSync(p));
if (!browserBin) {
  console.log('Aviso: No se encontró navegador local; se conservan los SVG pre-renderizados en web/public/diagramas/.');
  process.exit(0);
}

const tmpHtml = path.join(os.tmpdir(), `render-mermaid-${Date.now()}.html`);
const mermaidUrl = pathToFileURL(MERMAID_JS).href;

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: "Poppins", "Segoe UI", Arial, sans-serif; background: #FFFFFF; color: #16302B; }
  .edgeLabel, .edgeLabel p, .edgeLabel span, .edgeLabel div, .labelBkg {
    color: #16302B !important;
    fill: #16302B !important;
    background-color: #FFFFFF !important;
    background: #FFFFFF !important;
  }
</style>
<script src="${mermaidUrl}"></script>
</head>
<body>
<div id="results"></div>
<script>
  const diagrams = ${JSON.stringify(diagrams)};
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    fontFamily: '"Poppins", "Segoe UI", Arial, sans-serif',
    flowchart: {
      htmlLabels: false
    },
    themeVariables: {
      background: '#FFFFFF',
      primaryColor: '#FFFFFF',
      primaryTextColor: '#16302B',
      primaryBorderColor: '#0B6E5F',
      lineColor: '#3A4650',
      secondaryColor: '#F8FAFC',
      tertiaryColor: '#FFFFFF',
      edgeLabelBackground: '#FFFFFF',
      clusterBkg: '#F8FAFC',
      clusterBorder: '#94A3B8',
      actorBkg: '#FFFFFF',
      actorBorder: '#2F6BDB',
      actorTextColor: '#16302B',
      signalColor: '#16302B',
      signalTextColor: '#16302B',
      labelBoxBkgColor: '#FFFFFF',
      labelBoxBorderColor: '#2F6BDB',
      labelTextColor: '#16302B',
      loopTextColor: '#16302B'
    }
  });

  (async () => {
    const out = document.getElementById('results');
    for (const d of diagrams) {
      const { svg } = await mermaid.render('svg_' + d.id, d.code);
      const wrap = document.createElement('script');
      wrap.type = 'application/json';
      wrap.id = 'out_' + d.id;
      wrap.textContent = JSON.stringify({ id: d.id, file: d.file, svg });
      out.appendChild(wrap);
    }
    document.body.setAttribute('data-done', 'true');
  })();
</script>
</body>
</html>`;

fs.writeFileSync(tmpHtml, htmlContent, 'utf8');

const domDump = execFileSync(
  browserBin,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1200',
    '--allow-file-access-from-files',
    '--virtual-time-budget=8000',
    '--dump-dom',
    pathToFileURL(tmpHtml).href,
  ],
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
);

fs.unlinkSync(tmpHtml);

let count = 0;
for (const d of diagrams) {
  const re = new RegExp(`<script type="application/json" id="out_${d.id}">([\\s\\S]*?)<\\/script>`);
  const match = domDump.match(re);
  if (!match) {
    throw new Error(`No se pudo extraer el SVG renderizado para ${d.id} (${d.file})`);
  }
  const parsed = JSON.parse(match[1]);
  let svg = parsed.svg;

  const scopedEdgeStyle = `
  .edgeLabel,.edgeLabel p,.edgeLabel span{color:#16302B!important;fill:#16302B!important;background:#fff!important}
  #svg_${d.id} .edgeLabel, #svg_${d.id} .edgeLabel p, #svg_${d.id} .edgeLabel span, #svg_${d.id} .edgeLabel div, #svg_${d.id} .edgeLabel text, #svg_${d.id} .edgeLabel tspan {
    color: #16302B !important;
    fill: #16302B !important;
    background-color: #FFFFFF !important;
    background: #FFFFFF !important;
    font-weight: 600 !important;
  }
  #svg_${d.id} .edgeLabel rect, #svg_${d.id} .edgeLabel rect.background, #svg_${d.id} .labelBkg {
    fill: #FFFFFF !important;
    background-color: #FFFFFF !important;
    opacity: 1 !important;
  }
  #svg_${d.id} .label > rect:empty {
    fill: none !important;
    stroke: none !important;
  }
`;

  // Fijar width y height intrínsecos desde viewBox para que <img> nunca tenga alto 0 ni se recorte
  const vbMatch = svg.match(/viewBox="([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)"/);
  if (vbMatch) {
    const minX = Math.floor(parseFloat(vbMatch[1])) - 8;
    const minY = Math.floor(parseFloat(vbMatch[2])) - 8;
    const w = Math.ceil(parseFloat(vbMatch[3])) + 16;
    const h = Math.ceil(parseFloat(vbMatch[4])) + 16;
    svg = svg
      .replace(/viewBox="[^"]*"/, `viewBox="${minX} ${minY} ${w} ${h}"`)
      .replace(/\bwidth="100%"/, `width="${w}" height="${h}"`)
      .replace(/style="max-width:[^"]*"/, `style="max-width: 100%; height: auto; background-color: #FFFFFF;"`);
  }

  // Asegurar estilo .edgeLabel oscuro (#16302B) sobre blanco (#FFFFFF) tanto por CSS como por atributos inline SVG
  svg = svg
    .replace(/<\/style>/, `${scopedEdgeStyle}\n</style>`)
    .replace(
      /<rect class="background" style=""/g,
      '<rect class="background" fill="#FFFFFF" style="fill: #FFFFFF !important; opacity: 1 !important;"'
    )
    .replace(
      /<text y="([-\d.]+)" text-anchor="middle" style="">/g,
      '<text y="$1" text-anchor="middle" fill="#16302B" style="fill: #16302B !important; color: #16302B !important; font-weight: 600 !important;">'
    )
    .replace(
      /<tspan font-style="normal" class="text-inner-tspan" font-weight="normal">/g,
      '<tspan font-style="normal" class="text-inner-tspan" font-weight="600" fill="#16302B" style="fill: #16302B !important;">'
    );

  const shortPath = path.join(OUT_DIR, `${d.id}.svg`);
  const fullNamePath = path.join(OUT_DIR, d.file.replace(/\.mmd$/, '.svg'));
  fs.writeFileSync(shortPath, svg, 'utf8');
  fs.writeFileSync(fullNamePath, svg, 'utf8');
  count++;
  console.log(`[OK SVG] ${d.id}.svg (${Buffer.byteLength(svg, 'utf8')} bytes)`);
}

console.log(`Listo: ${count} diagramas pre-renderizados en web/public/diagramas/`);
