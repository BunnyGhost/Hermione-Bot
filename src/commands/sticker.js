// commands/sticker.js
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

// CONFIGURAÇÕES
const STICKER_CONFIG = {
  PACK_NAME: "By: Bunny Ghost",
  AUTHOR: "owo",
  QUALITY: 70
};

async function handleSticker(sock, message, from, content) {
  try {
    // 1. Identifica onde está a mídia
    // Pode estar na mensagem marcada (quoted) ou na própria mensagem enviada (direct)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const direct = message.message;
    
    // Tenta pegar a mensagem marcada primeiro, se não houver, pega a atual
    let targetMsg = quoted || direct;

    // Tratamento para mídias de visualização única
    if (targetMsg?.viewOnceMessageV2?.message) {
        targetMsg = targetMsg.viewOnceMessageV2.message;
    } else if (targetMsg?.viewOnceMessage?.message) {
        targetMsg = targetMsg.viewOnceMessage.message;
    }

    // 2. Verifica se é imagem ou vídeo (suporta imagem com legenda direta)
    const isImage = !!targetMsg?.imageMessage;
    const isVideo = !!targetMsg?.videoMessage;

    if (!isImage && !isVideo) {
      await sock.sendMessage(from, { text: "❌ Marque uma imagem/vídeo ou envie com a legenda */s*" }, { quoted: message });
      return true;
    }

    // 3. Define o tipo e os dados da mídia
    const mediaType = isVideo ? 'video' : 'image';
    const mediaMessage = isVideo ? targetMsg.videoMessage : targetMsg.imageMessage;
    
    // 4. Download da mídia
    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 5. Geração do Sticker (Ajuste automático para vídeo/GIF ou imagem)
    const sticker = new Sticker(buffer, {
      pack: STICKER_CONFIG.PACK_NAME,   
      author: STICKER_CONFIG.AUTHOR,    
      type: StickerTypes.FULL,          
      categories: ['🤩', '🎉'],
      id: 'bunny_sticker',
      quality: STICKER_CONFIG.QUALITY
    });

    const stickerBuffer = await sticker.toBuffer();

    // 6. Envio do resultado
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: message });

  } catch (error) {
    console.error("❌ Erro no Sticker:", error);
    await sock.sendMessage(from, { text: "❌ Erro ao processar o sticker. Verifique o console." }, { quoted: message });
  }

  return true;
}

module.exports = handleSticker;