// commands/hidden.js - COMANDO PARA REVELAR MÍDIA DE VISUALIZAÇÃO ÚNICA
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function handleHidden(sock, message, from, content) {
  // 1. O index.js já validou o comando, então removemos a trava redundante.

  try {
    // 2. Obtém a mensagem citada (reply)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quoted) {
      await sock.sendMessage(from, { text: "❌ Responda a uma mídia de visualização única com */hidden*" }, { quoted: message });
      return true;
    }

    // 3. Lógica para extrair mídia (trata View Once V1, V2 e mensagens normais)
    const viewOnce = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted;
    
    const isVideo = !!viewOnce.videoMessage;
    const isImage = !!viewOnce.imageMessage;
    const isAudio = !!viewOnce.audioMessage;
    const media = viewOnce.imageMessage || viewOnce.videoMessage || viewOnce.audioMessage;

    if (!media) {
      await sock.sendMessage(from, { text: "❌ Só imagens, vídeos e áudios são suportados pelo comando hidden." }, { quoted: message });
      return true;
    }

    // 4. Faz o download da mídia
    const mediaType = isVideo ? 'video' : isImage ? 'image' : 'audio';
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 5. Envia como MÍDIA NORMAL
    if (isVideo) {
      await sock.sendMessage(from, {
        video: buffer,
        caption: "🎥 *VÍDEO REVELADO*\n\nNada fica oculto para Bunny 🕶️"
      }, { quoted: message });
    } else if (isImage) {
      await sock.sendMessage(from, {
        image: buffer,
        caption: "📸 *IMAGEM REVELADA*\n\nNada fica oculto para Bunny 🕶️"
      }, { quoted: message });
    } else if (isAudio) {
      // Áudio é enviado como PTT (mensagem de voz) ou áudio normal
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: message });
    }

    console.log(`✅ Mídia revelada com sucesso para: ${from}`);

  } catch (error) {
    console.error("❌ Erro no /hidden:", error);
    await sock.sendMessage(from, { text: "❌ Erro ao processar mídia. Talvez ela já tenha expirado." }, { quoted: message });
  }

  return true;
}

module.exports = handleHidden;