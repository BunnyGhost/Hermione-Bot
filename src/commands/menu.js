// src/commands/menu.js
const config = require('../config');
const moment = require('moment-timezone');

const readMore = String.fromCharCode(8206).repeat(4001); // força o 'ler mais'

// Função para determinar a saudação baseada no horário da América Latina
function getGreeting() {
  const time = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
  
  if (time < "05:00:00") {
    return "Good Night 🌌";
  } else if (time < "11:00:00") {
    return "Good Morning 🌄";
  } else if (time < "15:00:00") {
    return "Good Afternoon 🌅";
  } else if (time < "19:00:00") {
    return "Good Evening 🌃";
  } else {
    return "Good Night 🌌";
  }
}

function BotMenu() {
  const greeting = getGreeting();
  const currentTime = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
  const currentDate = moment().tz('America/Sao_Paulo').format('DD/MM/YYYY');
  
  return `
╭━─━─━─≪⛈︎≫─━─━─━╮
│    ${greeting}
╭─────∘⟬𝑾𝒆𝒍𝒄𝒐𝒎𝒆⟭∘───⪨
│ 🕵️ ${config.BOT_NAME}
│ ⏰ ${currentTime}
│ 📅 ${currentDate}
╰─────────────⪨ 
${readMore}

╭─────Commands──────
│ ${config.PREFIX}menu 
> Exibe este menu
│ TesteJS 
> Mostra um segredo
│ ${config.PREFIX}ping 
> Testa a resposta e latência do bot.
╰──────────────────⪨

╭─────Sticker──────
│ ${config.PREFIX}s 
> Para criar uma figurinha
╰──────────────────⪨

╭─────Hidden──────
│ ${config.PREFIX}hidden 
> Restaura imagem para visualização normal.
╰──────────────────⪨

╭─────Who──────
│ ${config.PREFIX}who 
> Exibe informações sobre o registro de um domínio ou endereço IP. (whois).
╰──────────────────⪨

╭─────Ctt──────
│ ${config.PREFIX}ctt @membro 
> manda a foto de perfil da pessoa marcada.
╰──────────────────⪨
  `;
}

module.exports = BotMenu;