// ============================================================
// 📦 DEPENDÊNCIAS EXTERNAS
// Importação das bibliotecas do Baileys, Terminal e Sistema
// ============================================================
const {
  makeWASocket,
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  generateMessageIDV2,
  prepareWAMessageMedia
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const path   = require("path");
const fs     = require("fs");
const P      = require("pino"); // Silencia os logs JSON verbosos do Baileys

// ============================================================
// ⚙️  MÓDULOS INTERNOS DO BOT
// Importação de comandos e configurações locais
// ============================================================
const { PREFIX }      = require("./config");
const BotMenu         = require("./commands/menu");
const handleSticker   = require("./commands/sticker");
const handleHidden    = require("./commands/hidden");
const handleWho       = require("./commands/who");
const handleAudio     = require("./commands/audio");
const handleButtons   = require("./commands/buttonHandler"); // Captura cliques em botões
const { cttCommand }  = require("./commands/ctt");
const { sendButtons } = require("baileys_helpers");          // Botões simples (quick_reply / cta_url)

// ============================================================
// 🖼️  ASSETS — Caminhos centralizados das imagens
// Para trocar uma imagem, edite apenas aqui.
// ============================================================
const ASSETS = {
  menu     : path.join(__dirname, "assets", "menu2.jpg"),
  thumbnail: path.join(__dirname, "assets", "tumb.jpeg"),
  botImage : path.join(__dirname, "assets", "image.png")
};

// ============================================================
// 🎨  CORES DO TERMINAL (ANSI)
// Centralizadas aqui — para mudar uma cor, edite só esta linha.
// ============================================================
const C = {
  reset : "\x1b[0m",
  cyan  : "\x1b[36m",
  green : "\x1b[32m",
  yellow: "\x1b[33m",
  gray  : "\x1b[90m",
  white : "\x1b[37m",
  pink  : "\x1b[35m",
  blue  : "\x1b[34m",
  red   : "\x1b[31m"
};

// ============================================================
// 🖨️  LOGGER DO TERMINAL
// Formata a visualização das mensagens recebidas no console
// ============================================================
const getTime   = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const getName   = (msg, from) => (msg.pushName || from.split("@")[0].split(":")[0]).padEnd(16);
const getNumber = (from)      => from.split("@")[0].split(":")[0].padEnd(15);
const getOrigin = (from)      => from.endsWith("@g.us") ? "👥 Grupo  " : "👤 Privado";

// Formata e exibe mensagens recebidas no terminal
function logMessage(from, content, message) {
  console.log(
    `${C.cyan}[${getTime()}]${C.reset}  ${getOrigin(from)}  ` +
    `${C.green}${getName(message, from)}${C.reset}  ` +
    `${C.yellow}${getNumber(from)}${C.reset}  ` +
    `${C.gray}→${C.reset}  ${C.white}${content}${C.reset}`
  );
}

// Formata e exibe cliques em botões no terminal
function logButton(clickedId, from, message) {
  console.log(
    `${C.cyan}[${getTime()}]${C.reset}  ${C.pink}🖱️  Botão  ${C.reset}  ` +
    `${C.green}${getName(message, from)}${C.reset}  ` +
    `${C.yellow}${getNumber(from)}${C.reset}  ` +
    `${C.gray}→${C.reset}  ${C.white}${clickedId}${C.reset}`
  );
}

// Limpa o terminal e exibe o logo + cabeçalho da tabela de logs
function printHeader() {
  console.clear();
  console.log(`
\x1b[38;5;198m██╗  ██╗███████╗██████╗ ███╗   ███╗██╗ ██████╗ ███╗   ██╗███████╗\x1b[0m
\x1b[38;5;199m██║  ██║██╔════╝██╔══██╗████╗ ████║██║██╔═══██╗████╗  ██║██╔════╝\x1b[0m
\x1b[38;5;200m███████║█████╗  ██████╔╝██╔████╔██║██║██║   ██║██╔██╗ ██║█████╗  \x1b[0m
\x1b[38;5;201m██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║   ██║██║╚██╗██║██╔══╝  \x1b[0m
\x1b[38;5;207m██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║╚██████╔╝██║ ╚████║███████╗\x1b[0m
\x1b[38;5;218m╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝\x1b[0m
\x1b[35m         🤖 Bot WhatsApp by Bunny Ghost 🤖         \x1b[0m`);

  console.log(`\n${C.green}  🟢 CONECTADO COM SUCESSO!${C.reset}`);
  console.log(`${C.blue}  🤖 Bot pronto para receber mensagens!${C.reset}\n`);

  const LINHA = "─".repeat(85);
  console.log(`${C.gray}  ${LINHA}`);
  console.log(`  ${"[Hora]".padEnd(10)}${"Origem".padEnd(12)}${"Nome".padEnd(18)}${"Telefone".padEnd(17)}${"→  Mensagem"}`);
  console.log(`  ${LINHA}${C.reset}\n`);
}

// ============================================================
// 🚀 sendMixedButtons — Estrutura de botões interativos
// Configura os Nodes binários necessários para exibir os botões
// ============================================================
const BIZ_NODE = {
  tag    : "biz",
  attrs  : {},
  content: [{
    tag    : "interactive",
    attrs  : { type: "native_flow", v: "1" },
    content: [{ tag: "native_flow", attrs: { name: "mixed", v: "9" } }]
  }]
};

const BOT_NODE = { tag: "bot", attrs: { biz_bot: "1" } };

async function sendMixedButtons(sock, jid, { title, text, footer, imagePath, buttons }) {
  const isGroup = jid.endsWith("@g.us");

  // Transforma botões simples no formato aceito pelo WhatsApp
  const normalizedButtons = buttons.map((btn) =>
    btn.id && btn.text
      ? { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id }) }
      : btn
  );

  // Faz o upload da imagem se ela for fornecida
  let header = { title: title || "", hasMediaAttachment: false };
  if (imagePath) {
    const { imageMessage } = await prepareWAMessageMedia(
      { image: fs.readFileSync(imagePath) },
      { upload: sock.waUploadToServer }
    );
    header = { hasMediaAttachment: true, imageMessage };
  }

  // Gera o pacote final da mensagem interativa
  const msg = generateWAMessageFromContent(jid, {
    interactiveMessage: {
      header,
      body             : { text: text   || "" },
      footer           : { text: footer || "" },
      nativeFlowMessage: { buttons: normalizedButtons, messageParamsJson: "" }
    }
  }, {
    userJid  : sock.user?.id,
    messageId: generateMessageIDV2(sock.user?.id)
  });

  // Envia a mensagem com os nodes adicionais de renderização
  const additionalNodes = isGroup ? [BIZ_NODE] : [BIZ_NODE, BOT_NODE];
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes });
  return msg;
}

// ============================================================
// 🔌 CONEXÃO PRINCIPAL COM O WHATSAPP
// Gerencia autenticação, QR Code e Socket
// ============================================================
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version }          = await fetchLatestBaileysVersion();

    console.clear();
    console.log(`${C.yellow}⏳ Estabelecendo conexão com os servidores...${C.reset}`);

    const sock = makeWASocket({
      version,
      auth                          : state,
      logger                        : P({ level: "silent" }), 
      browser                       : Browsers.ubuntu("Chrome"),
      markOnlineOnConnect           : false,
      syncFullHistory               : false,
      generateHighQualityLinkPreview: true,
      phoneResponse                 : false
    });

    // ── EVENTOS DE STATUS DA CONEXÃO ──────────────────────────
    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr } = {}) => {
      if (qr) {
        console.clear();
        console.log("\n" + "=".repeat(50));
        console.log("📱 ESCANEIE O QR CODE PARA CONECTAR O BOT:");
        console.log("=".repeat(50));
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        printHeader();
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          fs.rmSync("auth_info_baileys", { recursive: true, force: true });
        }
        console.log(`${C.red}🔴 Conexão encerrada. Reconectando em 3s...${C.reset}`);
        setTimeout(connectToWhatsApp, 3000);
      }
    });

    // Salva alterações na sessão (login)
    sock.ev.on("creds.update", saveCreds);

    // ── EVENTO DE MENSAGENS RECEBIDAS ──────────────────────────
    sock.ev.on("messages.upsert", async ({ messages }) => {
      if (!messages?.length) return;

      const message = messages[0];
      if (!message.message) return;
      if (message.key.remoteJid === "status@broadcast") return;

      setTimeout(async () => {
        try {
          const from = message.key.remoteJid;

          // Detecta se o usuário clicou em um botão
          if (message.message?.interactiveResponseMessage) {
            let clickedId = "";
            try {
              const raw = message.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || "{}";
              clickedId = JSON.parse(raw).id || "";
            } catch (_) {}

            logButton(clickedId, from, message);
            await handleButtons(sock, message, clickedId);
            return;
          }

          // Identifica o texto da mensagem (Conversa, Legenda de imagem, etc)
          const content =
            message.message.conversation              ||
            message.message.extendedTextMessage?.text ||
            message.message.imageMessage?.caption      ||
            message.message.videoMessage?.caption      || "";

          logMessage(from, content, message);

          // Filtra mensagens que não possuem o prefixo do bot
          if (!content.startsWith(PREFIX)) return;
          const command = content.slice(PREFIX.length).trim().split(" ")[0].toLowerCase();

          // ══════════════════════════════════════════════════════════════
          // 📋 HUB DE COMANDOS — IF/ELSE
          // ══════════════════════════════════════════════════════════════

          // /bot — Apresentação com imagem e menu de botões
          if (command === "bot") {
            await sendMixedButtons(sock, from, {
              title    : "\nHermione Bot",
              text     : "*₍₍⚞(˶>⩊<˶)⚟⁾⁾* \n_Nya~_ Hi bro! Tô aqui pra te ajudar!\nEscolha uma opção abaixo:",
              footer   : "By: Bunny Ghost",
              imagePath: ASSETS.botImage,
              buttons  : [
                { id: "teste", text: "Oi" },
                {
                  name            : "single_select",
                  buttonParamsJson: JSON.stringify({
                    title   : "📋 Ver Comandos",
                    sections: [{
                      title: "⚙️ Menu de Comandos",
                      rows : [
                        { id: "cmd_ping",    title: "🏓 Ping",    description: "Testar latência"       },
                        { id: "cmd_menu",    title: "📋 Menu",    description: "Ver todos os comandos" },
                        { id: "cmd_sticker", title: "🖼️ Sticker", description: "Criar figurinhas"      },
                        { id: "cmd_info",    title: "ℹ️ Info",    description: "Sobre o bot"            }
                      ]
                    }]
                  })
                },
                {
                  name            : "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🌐 GitHub",
                    url         : "https://github.com/BunnyGhost",
                    merchant_url: "https://github.com/BunnyGhost"
                  })
                }
              ]
            });
            return;
          }

          // /au — Envia áudio
          if (command === "au") {
            await handleAudio(sock, from, message);
            return;
          }

          // /s — Faz figurinha
          if (command === "s") {
            await handleSticker(sock, message, from, content);
            return;
          }

          // /hidden — Texto invisível
          if (command === "hidden") {
            await handleHidden(sock, message, from, content);
            return;
          }

          // /who — Informações do usuário
          if (command === "who") {
            await handleWho(sock, message);
            return;
          }

          // /ctt — Envia contato vCard
          if (command === "ctt") {
            await cttCommand(sock, message, from, content);
            return;
          }

          // /menu — Menu visual principal
          if (command === "menu") {
            await sock.sendMessage(from, {
              image      : { url: ASSETS.menu },
              caption    : BotMenu(),
              contextInfo: {
                externalAdReply: {
                  title    : "By: Bunny Ghost",
                  body     : "Ethical Hacker And Dev",
                  mediaType: 1,
                  thumbnail: fs.readFileSync(ASSETS.thumbnail)
                }
              }
            });
            return;
          }

          // /ping — Mede velocidade de resposta
          if (command === "ping") {
            const start = Date.now();
            await sock.sendMessage(from, { text: "🏓 Pong!" });
            await sock.sendMessage(from, { text: `⏱️ Latência: ${Date.now() - start}ms` });
            return;
          }

          // /infos — Carrega comando de info externo
          if (command === "infos") {
            try {
              const infoCmd = require("./commands/info.js");
              await infoCmd(sock, from, PREFIX);
            } catch {
              await sock.sendMessage(from, { text: "❌ Erro ao carregar o módulo info.js" });
            }
            return;
          }

        } catch (err) {
          console.error(`${C.red}❌ Erro ao processar mensagem: ${err.message}${C.reset}`);
        }
      }, 1000);
    });

  } catch (error) {
    console.error(`${C.red}❌ Falha na conexão: ${error.message}${C.reset}`);
    setTimeout(connectToWhatsApp, 5000);
  }
}

// Executa a função inicializadora
connectToWhatsApp();