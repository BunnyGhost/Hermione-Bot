const path = require("path");
const fs = require("fs");

// Ajustado: como este arquivo já está em 'commands', o menu está na mesma pasta
const BotMenu = require("./menu"); 
// Ajustado: volta uma pasta para achar o config.js que está em 'src'
const { PREFIX } = require("../config"); 

/**
 * 🕹️ HandleButtons - Processa cliques em botões interativos
 */
async function handleButtons(sock, message) {
  const from = message.key.remoteJid;
  const interactiveReply = message.message?.interactiveResponseMessage;

  if (!interactiveReply) return;

  let clickedId = "";
  try {
    const rawParams = interactiveReply.nativeFlowResponseMessage?.paramsJson || "{}";
    const params = JSON.parse(rawParams);
    clickedId = params.id || interactiveReply.nativeFlowResponseMessage?.name || "";
  } catch (err) {
    console.error("❌ Erro ao processar ID do botão:", err);
    return;
  }

  console.log(`🖱️ Botão clicado: [${clickedId}] por ${from}`);

  try {
    switch (clickedId) {
      case "cmd_ping":
      case "teste": {
        const start = Date.now();
        await sock.sendMessage(from, { text: "⏳ Verificando latência..." });
        const latency = Date.now() - start;
        await sock.sendMessage(from, { text: `🏓 Pong!\n⏱️ Latência: ${latency}ms` });
        break;
      }

      case "cmd_menu": {
        // Ajustado caminho do assets para subir duas pastas (commands -> src -> assets)
        const menuImagePath = path.join(__dirname, "..", "assets", "menu2.jpg");
        const thumbPath = path.join(__dirname, "..", "assets", "flor1.jpeg");

        await sock.sendMessage(from, {
          image: fs.existsSync(menuImagePath) ? { url: menuImagePath } : { url: "https://via.placeholder.com/500" },
          caption: BotMenu(),
          contextInfo: {
            externalAdReply: {
              title: "By: Bunny Ghost",
              body: "Ethical Hacker And Dev",
              mediaType: 1,
              thumbnail: fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null
            }
          }
        });
        break;
      }

      case "cmd_sticker": {
        await sock.sendMessage(from, { 
          text: `🖼️ Envie uma imagem com a legenda *${PREFIX}s* para criar sua figurinha!` 
        });
        break;
      }

      case "cmd_info":
      case "infos": {
        try {
          const infoCmd = require("./info.js"); // Já está na pasta commands
          await infoCmd(sock, from, PREFIX);
        } catch (e) {
          await sock.sendMessage(from, { text: "❌ Erro ao carregar informações via botão." });
        }
        break;
      }

      default:
        if (clickedId) {
          await sock.sendMessage(from, { text: `🔔 Opção selecionada: *${clickedId}*` });
        }
        break;
    }
  } catch (error) {
    console.error("❌ Erro na execução da ação do botão:", error);
  }
}

module.exports = handleButtons;