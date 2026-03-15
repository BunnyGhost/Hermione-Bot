// 📂 commands/who.js
const axios = require("axios");

const handleWho = async (sock, message) => {
  try {
    const from = message.key.remoteJid;
    const content = 
      message.message.conversation || 
      message.message.extendedTextMessage?.text || "";

    const args = content.split(" ");
    if (args.length < 2) {
      await sock.sendMessage(from, { text: "❌ Informe um IP ou domínio. Ex: /whois 8.8.8.8" });
      return;
    }

    const ip = args[1];

    // API pública de geolocalização de IP
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;

    if (data.status !== "success") {
      await sock.sendMessage(from, { text: "❌ IP ou domínio inválido ou privado." });
      return;
    }

    let reply = `🔎 *WHOIS / OSINT - IP*\n\n`;
    reply += `🌐 IP: ${data.query}\n`;
    reply += `🏢 Organização/ISP: ${data.org || "Não disponível"}\n`;
    reply += `🏙 Cidade: ${data.city || "Não disponível"}\n`;
    reply += `🌍 País: ${data.country || "Não disponível"}\n`;
    reply += `🕓 Fuso horário: ${data.timezone || "Não disponível"}\n`;
    reply += `📌 Região: ${data.regionName || "Não disponível"}\n`;

    await sock.sendMessage(from, { text: reply });

  } catch (err) {
    console.error("❌ Erro no comando /whois OSINT:", err);
    await sock.sendMessage(message.key.remoteJid, { text: "❌ Não foi possível consultar o WHOIS. Verifique o IP ou domínio." });
  }
};

module.exports = handleWho;
