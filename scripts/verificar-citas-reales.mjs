#!/usr/bin/env node
/**
 * scripts/verificar-citas-reales.mjs
 *
 * 1) Recorre web/src/content/**\/*.md y, por cada bloque de código que el texto
 *    presente como salida real (arranque, condiciones, http-*, actuator, sql,
 *    junit, dependency-tree), comprueba que cada línea aparezca literalmente en
 *    el archivo correspondiente de web/src/data/evidencia/ (ignorando espacios
 *    finales), o que tenga una nota previa explícita antes del bloque.
 * 2) En los niveles 2, 3 y 4, compara además los bloques de código Java y
 *    .properties contra web/src/data/codigo/ bajo la misma regla (literal o con
 *    nota previa).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'web', 'src', 'content');
const EVIDENCIA_DIR = path.join(ROOT_DIR, 'web', 'src', 'data', 'evidencia');
const CODIGO_DIR = path.join(ROOT_DIR, 'web', 'src', 'data', 'codigo');

const EVIDENCIA_FILES = fs.existsSync(EVIDENCIA_DIR)
  ? fs.readdirSync(EVIDENCIA_DIR).filter((f) => !f.endsWith('.md'))
  : [];

const CODIGO_FILES = fs.existsSync(CODIGO_DIR)
  ? fs.readdirSync(CODIGO_DIR).filter((f) => f.endsWith('.java') || f.endsWith('.properties'))
  : [];

const evidenciaLineSets = new Map();
for (const file of EVIDENCIA_FILES) {
  const fullPath = path.join(EVIDENCIA_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
  evidenciaLineSets.set(file, new Set(lines));
}

const codigoLineSets = new Map();
for (const file of CODIGO_FILES) {
  const fullPath = path.join(CODIGO_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, ''));
  codigoLineSets.set(file, new Set(lines));
}

function walkMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results.sort();
}

function hasExplicitAdaptationNote(contextText) {
  return /comentarios numerados.*son míos|sangría está reducida para lectura|formateada en varias líneas para leerla.*ruta local omitida|nota previa|adaptado para lectura|extracto resumido|imports.*omitidos|versión simplificada/i.test(
    contextText
  );
}

function detectTargetFiles(relMd, contextText, lang, codeLines) {
  const isLevel234 = /nivel-[234]\//.test(relMd);

  // 1) Bloques Java y .properties en niveles 2, 3 y 4 contra web/src/data/codigo/
  if (lang === 'java' || lang === 'properties') {
    if (!isLevel234) return null;

    const mentionedCodigo = [];
    const joined = codeLines.join('\n');

    for (const file of CODIGO_FILES) {
      if (contextText.includes(file)) {
        mentionedCodigo.push(file);
      }
      if (file.endsWith('.java')) {
        const className = file.replace(/\.java$/, '');
        const classDeclRegex = new RegExp(`\\b(class|interface|record|enum)\\s+${className}\\b`);
        const contextClassRegex = new RegExp(`\\b${className}\\b`);
        if (
          (classDeclRegex.test(joined) || contextClassRegex.test(contextText)) &&
          !mentionedCodigo.includes(file)
        ) {
          mentionedCodigo.push(file);
        }
      }
    }

    if (mentionedCodigo.length > 0) {
      return { kind: 'codigo', files: mentionedCodigo };
    }

    return {
      kind: 'codigo',
      files: CODIGO_FILES.filter((f) => (lang === 'java' ? f.endsWith('.java') : f.endsWith('.properties')))
    };
  }

  // Ignorar XML/YAML en chequeo de evidencia/código
  if (['xml', 'yaml', 'yml'].includes(lang)) {
    return null;
  }

  // 2) Bloques de evidencia real en todos los niveles contra web/src/data/evidencia/
  const mentioned = [];
  for (const file of EVIDENCIA_FILES) {
    if (contextText.includes(file)) {
      mentioned.push(file);
    }
  }
  const shorthandHttp = contextText.match(/http-(\d{3}(?:\/\d{3})+)\.txt/);
  if (shorthandHttp) {
    const codes = shorthandHttp[1].split('/');
    for (const code of codes) {
      const candidate = `http-${code}.txt`;
      if (EVIDENCIA_FILES.includes(candidate) && !mentioned.includes(candidate)) {
        mentioned.push(candidate);
      }
    }
  }
  if (mentioned.length > 0) {
    const lastLine = contextText.split(/\r?\n/).filter(Boolean).pop() || '';
    const specificInLastLine = mentioned.filter((f) => lastLine.includes(f));
    const chosen = specificInLastLine.length > 0 ? specificInLastLine : mentioned;
    const withoutCompleto = chosen.filter((t) => t !== 'arranque-completo.log');
    return {
      kind: 'evidencia',
      files: withoutCompleto.length > 0 ? withoutCompleto : chosen
    };
  }

  const joined = codeLines.join('\n');
  if (lang === 'sql' || /select\s+c1_0|insert\s+into\s+citas/i.test(joined)) {
    return { kind: 'evidencia', files: ['sql-exists.txt', 'sql-insert.txt'] };
  }
  if (/CONDITIONS EVALUATION REPORT|Positive matches:|Negative matches:/.test(joined)) {
    return { kind: 'evidencia', files: ['condiciones.txt'] };
  }
  if (/Started ReservaMedicaApplication|Tomcat started on port/.test(joined)) {
    return { kind: 'evidencia', files: ['arranque.log'] };
  }
  if (/"livenessState"|"readinessState"|"diskSpace"/.test(joined) || /actuator/i.test(contextText)) {
    return { kind: 'evidencia', files: ['actuator-health.json'] };
  }
  if (/HTTP\/1\.1\s+\d{3}|"application\/problem\+json"|"instance":"\/api\/v1\/citas"/.test(joined)) {
    return { kind: 'evidencia', files: EVIDENCIA_FILES.filter((f) => f.startsWith('http-')) };
  }
  if (/Tests run:.*Failures:|BUILD SUCCESS/.test(joined) || /junit/i.test(contextText)) {
    return { kind: 'evidencia', files: ['junit-resumen.txt'] };
  }
  if (/dependency:tree|spring-boot-starter-webmvc:jar/.test(joined) || /dependency-tree/i.test(contextText)) {
    return { kind: 'evidencia', files: ['dependency-tree.txt'] };
  }

  return null;
}

function extractBlocks(mdPath) {
  const raw = fs.readFileSync(mdPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const blocks = [];

  let inBlock = false;
  let fenceIndent = '';
  let lang = '';
  let startLine = 0;
  let codeLines = [];
  let contextWindow = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock) {
      if (/^(#{1,6}\s|---\s*$)/.test(line)) {
        contextWindow = [{ lineNo: i + 1, text: line }];
        continue;
      }
      const openMatch = line.match(/^(\s*)```([^\s`]*)\s*$/);
      if (openMatch) {
        inBlock = true;
        fenceIndent = openMatch[1] || '';
        lang = (openMatch[2] || '').toLowerCase();
        startLine = i + 1;
        codeLines = [];
      } else {
        contextWindow.push({ lineNo: i + 1, text: line });
        if (contextWindow.length > 6) contextWindow.shift();
      }
    } else {
      const closeMatch = line.match(/^\s*```\s*$/);
      if (closeMatch) {
        blocks.push({
          startLine,
          endLine: i + 1,
          fenceIndent,
          lang,
          contextText: contextWindow.map((c) => c.text).join('\n'),
          codeLines
        });
        inBlock = false;
      } else {
        codeLines.push({ lineNo: i + 1, rawText: line });
      }
    }
  }
  return blocks;
}

const mdFiles = walkMarkdownFiles(CONTENT_DIR);
let totalCheckedBlocks = 0;
let mismatchedBlocks = 0;

for (const mdFile of mdFiles) {
  const relMd = path.relative(ROOT_DIR, mdFile).replace(/\\/g, '/');
  const blocks = extractBlocks(mdFile);

  for (const block of blocks) {
    const targetInfo = detectTargetFiles(
      relMd,
      block.contextText,
      block.lang,
      block.codeLines.map((c) => c.rawText)
    );
    if (!targetInfo || targetInfo.files.length === 0) continue;

    totalCheckedBlocks++;
    const lineSetMap = targetInfo.kind === 'codigo' ? codigoLineSets : evidenciaLineSets;
    const effectiveTargets = targetInfo.files;

    const missingLines = [];
    for (const item of block.codeLines) {
      const trimmedRight = item.rawText.replace(/\s+$/, '');
      const deindented =
        block.fenceIndent && trimmedRight.startsWith(block.fenceIndent)
          ? trimmedRight.slice(block.fenceIndent.length)
          : trimmedRight;

      if (trimmedRight === '') continue;

      const foundRaw = effectiveTargets.some((t) => lineSetMap.get(t)?.has(trimmedRight));
      const foundDeindented = effectiveTargets.some((t) => lineSetMap.get(t)?.has(deindented));

      if (!foundDeindented && !foundRaw) {
        missingLines.push({
          lineNo: item.lineNo,
          text: deindented
        });
      }
    }

    if (missingLines.length === 0) {
      console.log(
        `[OK LITERAL] ${relMd}:${block.startLine}-${block.endLine} -> [${effectiveTargets.join(', ')}]`
      );
    } else if (hasExplicitAdaptationNote(block.contextText)) {
      console.log(
        `[OK CON NOTA PREVIA] ${relMd}:${block.startLine}-${block.endLine} -> [${effectiveTargets.join(', ')}] (${missingLines.length} líneas con formato/extracto declarado)`
      );
    } else {
      mismatchedBlocks++;
      console.log(
        `[NO COINCIDE] ${relMd}:${block.startLine}-${block.endLine} -> contra [${effectiveTargets.join(', ')}] (${missingLines.length}/${block.codeLines.length} líneas no literales y sin nota previa)`
      );
      for (const m of missingLines) {
        console.log(`  L${m.lineNo}: ${m.text}`);
      }
    }
  }
}

console.log(`\nResumen: ${totalCheckedBlocks} bloques verificados, ${mismatchedBlocks} sin coincidencia literal ni nota previa.`);
if (mismatchedBlocks > 0) {
  process.exitCode = 1;
}
