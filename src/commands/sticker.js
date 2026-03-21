"use strict";

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const WebP            = require("node-webpmux");
const { spawn }       = require("child_process");
const { randomBytes } = require("crypto");
const fs              = require("fs/promises");
const path            = require("path");
const os              = require("os");

// ─── Config ───────────────────────────────────────────────────────────────────

const CFG = Object.freeze({
  PACK:      "By: Bunny Ghost",
  AUTHOR:    "owo",
  EMOJIS:    ["🤩"],
  SIZE:      512,                           // WhatsApp exige exatamente 512×512 px
  QUALITY:   80,
  FPS:       15,
  MAX_SECS:  10,                            // WA não aceita stickers animados > 10s
  THREADS:   Math.min(os.cpus().length, 4),
  MAX_IMG:   15 * 1024 * 1024,
  MAX_VID:   30 * 1024 * 1024,
  FFMPEG_TO: 30_000,
  MAX_QUEUE: 50,
});

// ─── Temp dir ─────────────────────────────────────────────────────────────────

// PID no nome evita colisão entre múltiplas instâncias do bot
const TMP = path.join(os.tmpdir(), `sticker-${process.pid}`);

// Lazy init: cria o diretório só quando for necessário pela primeira vez
const ensureTmp = (() => { let p; return () => p ??= fs.mkdir(TMP, { recursive: true }); })();

// rmSync no "exit" porque async não funciona após o loop de eventos encerrar
process.on("exit", () => { try { require("fs").rmSync(TMP, { recursive: true, force: true }); } catch {} });
["SIGTERM", "SIGINT"].forEach(s => process.on(s, () =>
  fs.rm(TMP, { recursive: true, force: true }).finally(() => process.exit(0))
));

// ─── Semaphore ────────────────────────────────────────────────────────────────

// Máximo 2 conversões simultâneas — ffmpeg é pesado e travaria o servidor se ilimitado
const sem = (() => {
  let slots = 2;
  const queue = [];
  return {
    acquire() {
      if (queue.length >= CFG.MAX_QUEUE) return Promise.reject(new Error("QUEUE_FULL"));
      return slots > 0 ? (slots--, Promise.resolve()) : new Promise(r => queue.push(r));
    },
    release() { queue.length ? queue.shift()() : slots++; },
  };
})();

// ─── Utils ────────────────────────────────────────────────────────────────────

const react = (sock, msg, emoji) =>
  sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } }).catch(() => {});

// Rejeita o stream antes de carregar tudo na memória — proteção contra arquivos gigantes
async function bufferFromStream(stream, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of stream) {
    if ((total += chunk.length) > limit) throw new Error("MEDIA_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Prioridade: mensagem citada → viewOnce → mensagem direta
function resolveMedia(msg) {
  const m = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ?? msg.message;
  return m?.viewOnceMessageV2?.message ?? m?.viewOnceMessage?.message ?? m;
}

// ─── ffmpeg ───────────────────────────────────────────────────────────────────

function ffmpeg(args, inputBuf) {
  return new Promise((resolve, reject) => {
    const piped = Buffer.isBuffer(inputBuf);
    const proc  = spawn("ffmpeg", args, { stdio: [piped ? "pipe" : "ignore", "pipe", "pipe"] });
    const out   = [], err = [];
    let settled = false;

    const settle = (fn, val) => { if (!settled) { settled = true; clearTimeout(timer); fn(val); } };
    // Sem timeout, um vídeo corrompido travaria o semáforo para sempre
    const timer  = setTimeout(() => { proc.kill("SIGKILL"); settle(reject, new Error("FFMPEG_TIMEOUT")); }, CFG.FFMPEG_TO);

    proc.stdout.on("data", c => out.push(c));
    proc.stderr.on("data", c => err.push(c));
    proc.on("error", e => settle(reject, e));
    proc.on("close", code =>
      settle(
        code === 0 ? resolve : reject,
        code === 0 ? Buffer.concat(out) : new Error(`ffmpeg(${code}): ${Buffer.concat(err).toString().slice(-400)}`)
      )
    );

    if (piped) proc.stdin.end(inputBuf);
  });
}

// ─── Converters ───────────────────────────────────────────────────────────────

const { SIZE: S, QUALITY: Q, FPS, MAX_SECS, THREADS: TH } = CFG;

// Redimensiona mantendo proporção e preenche o restante com transparência (letterbox)
const scalePad = (fps) =>
  `scale=${S}:${S}:force_original_aspect_ratio=decrease,` +
  `pad=${S}:${S}:(ow-iw)/2:(oh-ih)/2:color=0x00000000` +
  (fps ? `,fps=${fps}` : "");

// Imagens: tudo via stdin/stdout, sem tocar no disco
const imageToWebP = buf =>
  ffmpeg([
    "-y", "-i", "pipe:0",
    "-vf", `${scalePad()},format=rgba`,
    "-pix_fmt", "yuva420p", "-quality", String(Q), "-threads", String(TH), "-f", "webp", "pipe:1",
  ], buf);

// Vídeos precisam de arquivo temporário — libwebp animado não suporta output para stdout
async function videoToWebP(buf) {
  await ensureTmp();
  const id  = randomBytes(6).toString("hex");
  const inp = path.join(TMP, `i${id}`);
  const out = path.join(TMP, `o${id}.webp`);

  await fs.writeFile(inp, buf);
  try {
    await ffmpeg([
      "-y", "-i", inp,
      "-vf", scalePad(FPS),
      "-vcodec", "libwebp", "-pix_fmt", "yuva420p", "-lossless", "0",
      "-q:v", "50", "-loop", "0", "-t", String(MAX_SECS), "-an", "-threads", String(TH), out,
    ]);
    return fs.readFile(out);
  } finally {
    await Promise.allSettled([fs.unlink(inp), fs.unlink(out)]);
  }
}

// ─── EXIF metadata ────────────────────────────────────────────────────────────

async function withMetadata(buf) {
  const json = Buffer.from(
    JSON.stringify({ "sticker-pack-name": CFG.PACK, "sticker-pack-publisher": CFG.AUTHOR, emojis: CFG.EMOJIS })
  );

  // TIFF mínimo com a tag proprietária do WhatsApp (0x5741 = "WA")
  // Layout: header(8) + IFD count(2) + entry(12) + next IFD(4) + payload JSON
  const exif = Buffer.alloc(26 + json.length);
  const w = (v, o, t) => exif[`write${t}`](v, o);
  w(0x4949, 0,  "UInt16LE"); // little-endian
  w(0x002A, 2,  "UInt16LE"); // magic TIFF: 42
  w(8,      4,  "UInt32LE"); // offset do IFD
  w(1,      8,  "UInt16LE"); // 1 entry
  w(0x5741, 10, "UInt16LE"); // tag "WA"
  w(7,      12, "UInt16LE"); // tipo: UNDEFINED
  w(json.length, 14, "UInt32LE");
  w(26,     18, "UInt32LE"); // offset dos dados
  w(0,      22, "UInt32LE"); // próximo IFD: nenhum
  json.copy(exif, 26);

  const img = new WebP.Image();
  await img.load(buf);
  img.exif = exif;
  return img.save(null); // null = retorna Buffer em vez de gravar em disco
}

// ─── Error messages ───────────────────────────────────────────────────────────

const ERRORS = {
  MEDIA_TOO_LARGE: "❌ Arquivo grande demais para virar sticker.",
  FFMPEG_TIMEOUT:  "❌ Tempo limite excedido ao processar.",
  EMPTY_OUTPUT:    "❌ Conversão gerou resultado vazio.",
  QUEUE_FULL:      "❌ Muitos stickers sendo processados. Tente em instantes.",
};

const errorText = e =>
  Object.entries(ERRORS).find(([k]) => e.message?.startsWith(k))?.[1] ?? "❌ Erro ao criar o sticker.";

// ─── Main handler ─────────────────────────────────────────────────────────────

async function handleSticker(sock, msg, from) {
  const target  = resolveMedia(msg);
  const isVideo = !!target?.videoMessage;
  const isImage = !!target?.imageMessage;

  if (!isImage && !isVideo) {
    await sock.sendMessage(from, { text: "❌ Marque uma imagem/vídeo ou envie com a legenda */s*" }, { quoted: msg });
    return true;
  }

  await react(sock, msg, "⏳");
  await sem.acquire();

  try {
    const mediaMsg = isVideo ? target.videoMessage : target.imageMessage;
    const stream   = await downloadContentFromMessage(mediaMsg, isVideo ? "video" : "image");
    const buf      = await bufferFromStream(stream, isVideo ? CFG.MAX_VID : CFG.MAX_IMG);
    const webp     = await (isVideo ? videoToWebP(buf) : imageToWebP(buf));

    if (!webp?.length) throw new Error("EMPTY_OUTPUT");

    await sock.sendMessage(from, { sticker: await withMetadata(webp) }, { quoted: msg });
    await react(sock, msg, "✅");
  } catch (e) {
    console.error("sticker error:", e.message);
    await react(sock, msg, "❌");
    await sock.sendMessage(from, { text: errorText(e) }, { quoted: msg });
  } finally {
    sem.release(); // sempre libera o slot — mesmo em caso de erro
  }

  return true;
}

module.exports = handleSticker;
