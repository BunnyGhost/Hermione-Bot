// src/commands/help.js
const { PREFIX } = require("../config");

// ── O que cada comando faz ──────────────────────────────────
// Para adicionar um comando novo, basta incluir uma linha aqui.
const AJUDA = {
  menu  : "Exibe o menu principal com todos os comandos.",
  help  : "Explica o que um comando faz.\nUso: /help <comando>",
  ping  : "Testa a resposta e a latência do bot.",
  bot   : "Apresentação do bot com botões interativos.",
  infos : "Mostra informações sobre o bot.",
  s     : "Cria uma figurinha.",
  hidden: "Restaura a imagem para visualização normal.",
  who   : "Exibe informações sobre o registro de um domínio ou endereço IP (whois).",
  ctt   : "Envia a foto de perfil da pessoa marcada.\nUso: /ctt @membro",
  au    : "Envia um áudio.",
  yt    : "Baixa vídeos do YouTube.\nUso: /yt <link>",
  pin   : "Baixa vídeos do Pinterest.\nUso: /pin <link>",
  insta : "Baixa vídeos e reels do Instagram.\nUso: /insta <link>",
  tiktok: "Baixa vídeos do TikTok.\nUso: /tiktok <link>",
  clima : "Mostra o tempo agora e a previsão de hoje e amanhã.\nUso: /clima cidade UF\nExemplo: /clima curitiba pr"
};

async function handleHelp(sock, message, from, content) {
  const reply = (text) => sock.sendMessage(from, { text }, { quoted: message });

  // Pega o nome do comando: "/help yt" ou "/help /yt"
  let nome = (content.trim().split(/\s+/)[1] || "").toLowerCase();
  if (nome.startsWith(PREFIX)) nome = nome.slice(PREFIX.length);

  // /help sem nome → lista os comandos
  if (!nome) {
    const lista = Object.keys(AJUDA).map((c) => `• ${PREFIX}${c}`).join("\n");
    return reply(`📖 *Ajuda*\nUse ${PREFIX}help <comando> para ver o que ele faz.\n\n${lista}`);
  }

  // Comando não existe
  if (!AJUDA[nome]) {
    return reply(`❌ Comando *${nome}* não encontrado.\nUse ${PREFIX}help para ver a lista.`);
  }

  return reply(`📖 *${PREFIX}${nome}*\n\n${AJUDA[nome]}`);
}

module.exports = handleHelp;
