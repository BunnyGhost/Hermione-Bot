const fs = require("fs");
const path = require("path");

module.exports = async (sock, from, PREFIX) => {
  // 1. Início do cálculo de latência (imediatamente no topo)
  const inicio = Date.now();

  // DATA E HORA
  const agora = new Date();
  const data = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");

  // UPTIME
  const uptime = process.uptime();
  const up_h = Math.floor(uptime / 3600);
  const up_m = Math.floor((uptime % 3600) / 60);
  const up_s = Math.floor(uptime % 60);

  // 2. Cálculo da latência final antes de montar o texto
  // Isso mede o tempo de processamento interno do script
  const ping = Date.now() - inicio;

  // TEXTO DO INFO
  const texto = `
> 📊 *Status do Sistema*

📅 *Data:* ${data}
⏰ *Hora:* ${hora}
⏳ *Ativo há:* ${up_h}h ${up_m}m ${up_s}s
⚡ *Latência:* ${ping}ms
`;

  // ARQUIVOS (Verificação de existência para evitar crash)
  const thumbPath = path.join(__dirname, "../assets/infos.jpeg");
  const gifPath = path.join(__dirname, "../assets/menu.mp4");

  try {
    // ENVIA UMA ÚNICA MENSAGEM
    await sock.sendMessage(from, {
      video: fs.readFileSync(gifPath),
      gifPlayback: true,
      caption: texto,
      contextInfo: {
        externalAdReply: {
          title: "Hermione Shelby",
          body: "By: Bunny Ghost",
          mediaType: 1,
          thumbnail: fs.readFileSync(thumbPath),
          renderLargerThumbnail: true,
          sourceUrl: "https://github.com/BunnyGhost" // Opcional: link ao clicar na thumb
        }
      }
    });
  } catch (err) {
    console.error("❌ Erro ao enviar infos:", err);
    await sock.sendMessage(from, { text: "❌ Erro ao carregar arquivos de mídia do comando info." });
  }
};