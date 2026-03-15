const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function handleAudio(sock, from, message) {
  try {
    const audioPath = path.join(__dirname, "..", "assets", "audio.mp4");
    const convertedPath = path.join(__dirname, "..", "assets", "audio_converted.ogg");

    if (!fs.existsSync(audioPath)) {
      console.log("❌ Arquivo não encontrado em:", audioPath);
      return;
    }

    // Converter áudio para o formato correto (OPUS/OGG)
    console.log("🔄 Convertendo áudio...");
    await execPromise(`ffmpeg -i "${audioPath}" -c:a libopus -b:a 16k -ac 1 -ar 16000 -vn "${convertedPath}" -y`);

    // Ler o arquivo convertido
    const audioBuffer = fs.readFileSync(convertedPath);

    // Obter duração do áudio
    const { stdout } = await execPromise(`ffprobe -i "${convertedPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
    const duration = Math.ceil(parseFloat(stdout)) || 10;

    // Status de gravando
    await sock.sendPresenceUpdate('recording', from);
    
    // Pequena pausa para simular gravação
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Enviar áudio no formato correto
    await sock.sendMessage(from, {
      audio: audioBuffer,
      mimetype: 'audio/ogg; codecs=opus', // Formato correto para PTT
      ptt: true,
      duration: duration,
      waveform: [0, 0.5, 0.2, 0.8, 0.3, 0.6, 0.4, 0.9, 0.5, 0.3], // Opcional: forma de onda visual
    }, { quoted: message });

    // Limpar arquivo temporário
    fs.unlinkSync(convertedPath);
    
    await sock.sendPresenceUpdate('paused', from);
    console.log("✅ Áudio enviado com sucesso! Duração:", duration, "segundos");

  } catch (error) {
    console.error("❌ Erro ao enviar áudio:", error);
  }
}

module.exports = handleAudio;