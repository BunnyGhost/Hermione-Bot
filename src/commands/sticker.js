"use strict"; // Ativa o modo estrito do JS (evita bugs silenciosos)

// ─── Dependências ────────────────────────────────────────────────────────────
const { downloadContentFromMessage } = require("@whiskeysockets/baileys"); // Baixa mídia do WhatsApp
const WebP   = require("node-webpmux");   // Lê/edita arquivos WebP
const { spawn } = require("child_process"); // Executa programas externos (FFmpeg)
const { randomBytes } = require("crypto");  // Gera bytes aleatórios (nomes únicos de arquivo)
const fs   = require("fs/promises");  // Lê e escreve arquivos (versão async)
const path = require("path");         // Monta caminhos de pasta/arquivo
const os   = require("os");           // Info do sistema (CPUs, pasta temporária)

// ─── Configurações ───────────────────────────────────────────────────────────
const CFG = Object.freeze({ // Object.freeze = impede alterações acidentais
    AUTHOR: "By: Bunny Ghost", // Autor padrão do sticker
    EMOJIS: ["🤩"],            // Emojis vinculados ao sticker (ou talvez não)
    SIZE: 512,                 // WhatsApp exige exatamente 512×512px
    QUALITY: 75,               // Qualidade WebP — 0 (ruim) a 100 (perfeito)
    FPS: 10,                   // Frames por segundo do sticker animado
    MAX_SECS: 6,               // Corta vídeos acima de 6 segundos
    THREADS: Math.min(os.cpus().length, 4), // Usa até 4 núcleos do processador
    FFMPEG_TO: 30_000,         // Mata o FFmpeg se demorar mais de 30s
});

const PREFS_PATH = path.join(process.cwd(), "prefs.json"); // Arquivo com apelidos dos usuários
const TMP_DIR = path.join(os.tmpdir(), `sticker-bot-${randomBytes(4).toString("hex")}`); // Pasta temp única por sessão

// Cria a pasta temporária se não existir
const ensureTmp = async () => {
    try   { await fs.access(TMP_DIR); }          // Testa se já existe
    catch { await fs.mkdir(TMP_DIR, { recursive: true }); } // Se não, cria
};

// ─── Motor de Conversão ──────────────────────────────────────────────────────

// Roda o FFmpeg com os argumentos dados e retorna o resultado como Buffer
function ffmpeg(args, inputBuf) {
    return new Promise((resolve, reject) => {
        const isBuffer = Buffer.isBuffer(inputBuf); // Verifica se a entrada vem em memória

        // Inicia o processo FFmpeg
        const proc = spawn("ffmpeg", args, {
            stdio: [
                isBuffer ? "pipe" : "ignore", // stdin: recebe dados em memória OU ignora (lê do disco)
                "pipe",  // stdout: devolve o resultado convertido
                "pipe",  // stderr: captura logs e erros do FFmpeg
            ]
        });

        const out = []; // Acumula os pedaços do arquivo de saída
        const err = []; // Acumula logs do FFmpeg (útil para debug)
        let settled = false; // Garante que a Promise só resolve/rejeita uma vez

        // Segurança: mata o FFmpeg se travar além do tempo limite
        const timer = setTimeout(() => {
            proc.kill("SIGKILL");
            if (!settled) { settled = true; reject(new Error("TIMEOUT")); }
        }, CFG.FFMPEG_TO);

        proc.stdout.on("data", c => out.push(c)); // Coleta os dados de saída
        proc.stderr.on("data", c => err.push(c)); // Coleta os logs

        proc.on("close", code => {
            if (settled) return;   // Já foi resolvido (ex: timeout), ignora
            settled = true;
            clearTimeout(timer);   // Cancela o timer pois terminou a tempo
            code === 0
                ? resolve(Buffer.concat(out)) // Sucesso: une todos os pedaços
                : reject(new Error("FFMPEG_ERR")); // Falha: rejeita
        });

        if (isBuffer) proc.stdin.end(inputBuf); // Envia os dados para o FFmpeg via stdin
    });
}

// Converte imagem ou vídeo → WebP 512×512 com fundo transparente
async function processMedia(buf, isVideo) {

    // Filtro FFmpeg: redimensiona mantendo proporção + centraliza + preenche com transparência
    const filter = `scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;

    // ── Imagem estática: processa tudo em memória (mais rápido) ──────────────
    if (!isVideo) {
        return ffmpeg([
            "-y",                            // Sobrescreve saída sem perguntar
            "-i", "pipe:0",                  // Lê entrada do stdin (memória)
            "-vf", filter,                   // Aplica o filtro de resize/transparência
            "-pix_fmt", "yuva420p",          // Formato com canal alpha (transparência)
            "-quality", String(CFG.QUALITY), // Qualidade da compressão
            "-f", "webp", "pipe:1"           // Saída como WebP direto no stdout
        ], buf);
    }

    // ── Vídeo/GIF: FFmpeg não aceita vídeo via stdin, então salva no disco ───
    await ensureTmp();
    const id  = randomBytes(4).toString("hex");  // ID aleatório evita conflito entre conversões simultâneas
    const inp = path.join(TMP_DIR, `i${id}`);    // Caminho do vídeo original (entrada)
    const out = path.join(TMP_DIR, `o${id}.webp`); // Caminho do sticker gerado (saída)

    await fs.writeFile(inp, buf); // Salva o vídeo no disco para o FFmpeg processar

    try {
        await ffmpeg([
            "-y", "-i", inp,                     // Lê o vídeo do disco
            "-vf", `${filter},fps=${CFG.FPS}`,   // Resize/transparência + limita FPS
            "-vcodec", "libwebp",                // Codec de saída: WebP
            "-lossless", "0",                    // Compressão com perdas (arquivo menor)
            "-q:v", "40",                        // Qualidade do vídeo (0–100)
            "-loop", "0",                        // Loop infinito no sticker animado
            "-t", String(CFG.MAX_SECS),          // Corta no tempo máximo
            "-preset", "picture",                // Otimizado para imagens com transparência
            "-an",                               // Remove áudio (sticker não tem som)
            "-vsync", "0",                       // Sem sincronização de clock (evita frames duplicados)
            out                                  // Salva resultado no disco
        ]);
        return await fs.readFile(out); // Lê o sticker do disco e retorna como Buffer

    } finally {
        // Apaga os temporários sempre — mesmo se a conversão falhar
        await Promise.allSettled([
            fs.unlink(inp).catch(() => {}),
            fs.unlink(out).catch(() => {}),
        ]);
    }
}

// ─── Injeção de Metadados ─────────────────────────────────────────────────────

// Insere pack, autor e emojis no WebP via bloco EXIF (formato que o WhatsApp lê)
async function withMetadata(buf, pack, author) {
    const img = new WebP.Image();
    await img.load(buf); // Carrega o WebP em memória para edição

    // Dados que o WhatsApp vai exibir no sticker
    const json = {
        "sticker-pack-id": randomBytes(16).toString("hex"), // ID único do pack
        "sticker-pack-name": pack,       // Nome do pacote de figurinhas
        "sticker-pack-publisher": author, // Autor exibido no WhatsApp
        "emojis": CFG.EMOJIS             // Emojis associados
    };

    const jsonStr = JSON.stringify(json);     // Converte para string JSON
    const jsonLen = Buffer.byteLength(jsonStr); // Tamanho em bytes (necessário no cabeçalho)

    // Monta o bloco EXIF manualmente no formato TIFF little-endian que o WhatsApp espera
    const exif = Buffer.alloc(22 + jsonLen);  // 22 bytes de cabeçalho + o JSON
    exif.write("II\x2A\x00\x08\x00\x00\x00\x01\x00\x41\x57\x07\x00", 0, "binary"); // Cabeçalho TIFF com tag WhatsApp
    exif.writeUInt32LE(jsonLen, 14); // Tamanho do JSON na posição 14
    exif.writeUInt32LE(22, 18);      // Offset de início do JSON na posição 18
    exif.write(jsonStr, 22);         // Escreve o JSON a partir do byte 22

    img.exif = exif;          // Injeta o bloco EXIF na imagem
    return await img.save(null); // Retorna o WebP modificado como Buffer (null = não salva no disco)
}

// ─── Handler Principal ────────────────────────────────────────────────────────

async function handleSticker(sock, msg, from, content = "") {
    try {
        // ── Localiza a mídia: aceita resposta a mensagem ou envio direto ─────
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; // Mensagem respondida
        const m      = quoted || msg.message; // Usa a citada se existir, senão a atual

        // Suporte a mensagens "view-once" (somem após visualização)
        const target = m?.viewOnceMessageV2?.message || m?.viewOnceMessage?.message || m;

        const isVideo = !!target?.videoMessage || !!target?.imageMessage?.mimetype?.includes("gif"); // Vídeo ou GIF?
        const isImage = !!target?.imageMessage; // Imagem estática?

        if (!isImage && !isVideo) return; // Sem mídia suportada → ignora silenciosamente

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {}); // Avisa que está processando

        // ── Download da mídia ─────────────────────────────────────────────────
        const mediaData = isVideo ? (target.videoMessage || target.imageMessage) : target.imageMessage;
        const stream    = await downloadContentFromMessage(mediaData, isVideo ? "video" : "image");

        let chunks = [];
        for await (const chunk of stream) chunks.push(chunk); // Lê o stream em pedaços
        // Buffer.concat une todos os pedaços em um único arquivo em memória

        // ── Conversão para WebP ───────────────────────────────────────────────
        const webp = await processMedia(Buffer.concat(chunks), isVideo);

        // ── Define pack e autor ───────────────────────────────────────────────
        const userName = msg.pushName || "User";              // Nome do WhatsApp do remetente
        const sender   = msg.key.participant || msg.key.remoteJid; // ID único do remetente

        // Tenta carregar o apelido personalizado do usuário no prefs.json
        let userAlias = null;
        try {
            const data = JSON.parse(await fs.readFile(PREFS_PATH, "utf-8"));
            userAlias = data[sender]; // undefined se não cadastrado
        } catch {} // Arquivo inexistente ou corrompido → sem problema

        // Hierarquia: argumento do comando → apelido salvo → nome do WhatsApp
        const args        = content.split("|");
        const finalPack   = args[1]?.trim() || CFG.AUTHOR;
        const finalAuthor = args[2]?.trim() || userAlias || userName;

        // ── Monta e envia o sticker ───────────────────────────────────────────
        const finalSticker = await withMetadata(webp, finalPack, finalAuthor); // Injeta metadados

        await sock.sendMessage(from, { sticker: finalSticker }, { quoted: msg }); // Envia o sticker
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {}); // Confirma sucesso

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {}); // Avisa falha
    }
}

module.exports = handleSticker; // Exporta para o arquivo principal do bot
