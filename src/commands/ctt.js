/**
 * Comando /ctt - Envia a foto de perfil de um usuário
 */

async function cttCommand(sock, message, from, content) {
    const isGroup = from.endsWith("@g.us"); // Verifica se é grupo

    // Pega a menção ou número
    let jidTarget = null;

    // Se tiver menção
    if (message.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        jidTarget = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else {
        // Se passar o número diretamente
        const number = content.split(" ")[1]?.replace(/\D/g, ""); // Remove tudo que não é número
        if (number) {
            jidTarget = number + "@s.whatsapp.net";
        }
    }

    if (!jidTarget) {
        await sock.sendMessage(from, { text: "❌ Informe um número ou marque alguém no grupo!" });
        return true;
    }

    try {
        // Pega a foto de perfil do usuário
        const ppUrl = await sock.profilePictureUrl(jidTarget, "image");

        // Envia a imagem com legenda fixa
        await sock.sendMessage(from, {
            image: { url: ppUrl },
            caption: "📸 Segue foto de perfil do membro marcado."
        });
    } catch (err) {
        await sock.sendMessage(from, { text: "❌ Não foi possível obter a foto de perfil." });
    }

    return true;
}

module.exports = { cttCommand };
