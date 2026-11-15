// ============================================================
// 📥 DOWNLOADER — yt-dlp
// Comandos: /yt  /pin  /insta  /tiktok
// Só baixa conteúdo PÚBLICO (sem login / sem cookies).
// Requer o yt-dlp instalado no sistema (ou YTDLP_PATH no ambiente).
//
// Reações na mensagem do comando:
//   ⏳ baixando   ✅ enviado com sucesso   ❌ erro (com explicação)
// ============================================================
const { spawn } = require("child_process");
const path = require("path");
const fs   = require("fs");
const os   = require("os");

// ── CONFIGURAÇÕES ───────────────────────────────────────────
const YTDLP      = process.env.YTDLP_PATH || "yt-dlp";
const TMP_DIR    = path.join(os.tmpdir(), "bot-downloads");
const MAX_MB     = 100;              // limite de tamanho do vídeo
const TIMEOUT_MS = 3 * 60 * 1000;    // 3 minutos por download
const MAX_TITLE  = 200;              // tamanho máximo do título na legenda

// ── PLATAFORMAS ─────────────────────────────────────────────
const PLATFORMS = {
  youtube  : { name: "YouTube",   cmd: "yt",     regex: /^https?:\/\/([\w-]+\.)*(youtube\.com|youtu\.be)\//i },
  pinterest: { name: "Pinterest", cmd: "pin",    regex: /^https?:\/\/([\w-]+\.)*(pinterest\.[a-z.]+|pin\.it)\//i },
  instagram: { name: "Instagram", cmd: "insta",  regex: /^https?:\/\/([\w-]+\.)*instagram\.com\//i },
  tiktok   : { name: "TikTok",    cmd: "tiktok", regex: /^https?:\/\/([\w-]+\.)*tiktok\.com\//i }
};

// Evita que o mesmo usuário rode vários downloads ao mesmo tempo
const busy = new Set();

// ── LEGENDA DO VÍDEO ────────────────────────────────────────
// 🎬 Plataforma
// Título
//
// ✅ Vídeo baixado com sucesso
//
// ```> By: Bunny Ghost```
function buildCaption(platformName, title) {
  const cleanTitle = (title || "").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
  return (
    `🎬 *${platformName}*\n` +
    (cleanTitle ? `${cleanTitle}\n` : "") +
    `\n✅ Vídeo baixado com sucesso\n\n` +
    `> By: Bunny Ghost`
  );
}

// ── EXPLICA O ERRO ──────────────────────────────────────────
// Transforma o erro do yt-dlp numa mensagem clara para o usuário
function explainError(rawMsg) {
  const msg = String(rawMsg || "");

  if (msg === "NO_YTDLP") return "yt-dlp não está instalado no servidor do bot.";
  if (msg === "TIMEOUT")  return `O download demorou mais de ${TIMEOUT_MS / 60000} minutos e foi cancelado.`;
  if (msg === "NO_FILE")  return "O download terminou, mas o arquivo do vídeo não foi encontrado.";

  if (/larger than max-filesize/i.test(msg)) {
    return `O vídeo passa do limite de ${MAX_MB}MB.`;
  }

  // Conteúdo que exige login, conta privada ou restrição de público
  if (/login|log in|sign in|private|available to everyone|certain audiences|age-restricted|confirm your age|members-only|rate-limit/i.test(msg)) {
    return "🔒 Esse vídeo é *privado* ou tem restrição de público (idade, região ou conta), então não consigo baixar. Só baixo conteúdo público.";
  }

  if (/unsupported url|no video|there is no video|no media/i.test(msg)) {
    return "Não encontrei um vídeo nesse link.";
  }

  if (/video unavailable|has been removed|does not exist|not found|404/i.test(msg)) {
    return "O vídeo não está mais disponível (foi removido ou o link está errado).";
  }

  // Erro desconhecido: mostra o motivo real que o yt-dlp informou
  const lines  = msg.split("\n").map((l) => l.trim()).filter(Boolean);
  const errLine = lines.find((l) => /^ERROR:/i.test(l)) || lines[0] || "erro desconhecido";
  const detail  = errLine.replace(/^ERROR:\s*/i, "").slice(0, 200);
  return `Não consegui baixar esse vídeo.\n\n*Erro:*\n\`\`\`${detail}\`\`\``;
}

// ── EXECUTA O yt-dlp ────────────────────────────────────────
// Baixa o vídeo e devolve o título (via --print + --no-simulate)
function runYtDlp(url, outTemplate) {
  return new Promise((resolve, reject) => {
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--restrict-filenames",
      "--max-filesize", `${MAX_MB}M`,
      "--print", "%(title)s", // imprime o título no stdout
      "--no-simulate",        // mas baixa o vídeo normalmente
      // Prefere MP4 até 720p (não precisa de ffmpeg para juntar áudio/vídeo)
      "-f", "b[ext=mp4][height<=720]/b[ext=mp4]/b",
      "-o", outTemplate,
      "--", url               // "--" impede que a URL seja lida como opção
    ];

    const proc = spawn(YTDLP, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("TIMEOUT"));
    }, TIMEOUT_MS);

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err.code === "ENOENT" ? new Error("NO_YTDLP") : err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(stdout.trim().split("\n")[0] || "");
      reject(new Error(stderr.trim() || `yt-dlp saiu com código ${code}`));
    });
  });
}

// ── HANDLER PRINCIPAL ───────────────────────────────────────
// platformKey: "youtube" | "pinterest" | "instagram" | "tiktok"
async function handleDownload(sock, message, from, content, platformKey) {
  const platform = PLATFORMS[platformKey];
  const sender   = message.key.participant || from;
  const reply    = (text) => sock.sendMessage(from, { text }, { quoted: message });

  // Reage na mensagem do comando (uma nova reação substitui a anterior)
  const react = (emoji) =>
    sock.sendMessage(from, { react: { text: emoji, key: message.key } }).catch(() => {});

  // Pega a URL: /yt <link>
  const url = content.trim().split(/\s+/)[1];

  if (!url || !platform.regex.test(url)) {
    return reply(`⚠️ Envie um link válido do ${platform.name}.\nExemplo: */${platform.cmd} https://...*`);
  }

  if (busy.has(sender)) {
    return reply("⏳ Você já tem um download em andamento. Aguarde terminar.");
  }
  busy.add(sender);

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    await react("⏳"); // baixando
    const title = await runYtDlp(url, path.join(TMP_DIR, `${id}.%(ext)s`));

    const file = fs.readdirSync(TMP_DIR).find((f) => f.startsWith(id));
    if (!file) throw new Error("NO_FILE");
    const filePath = path.join(TMP_DIR, file);

    await sock.sendMessage(
      from,
      { video: { url: filePath }, mimetype: "video/mp4", caption: buildCaption(platform.name, title) },
      { quoted: message }
    );
    await react("✅"); // sucesso
  } catch (err) {
    console.error(`[downloader:${platformKey}]`, String(err.message || err));
    await react("❌"); // erro
    await reply(`❌ ${explainError(err.message)}`);
  } finally {
    // Limpa os arquivos temporários desse download
    for (const f of fs.readdirSync(TMP_DIR)) {
      if (f.startsWith(id)) fs.rmSync(path.join(TMP_DIR, f), { force: true });
    }
    busy.delete(sender);
  }
}

module.exports = handleDownload;
