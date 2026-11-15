<div align="center">

# ✦ Hermione Bot — Guia de Instalação no Termux ✦

<img src="https://i.pinimg.com/originals/8e/2c/fc/8e2cfc1636bbc9364d63ebe67b7176fe.gif" width="300" alt="Hermione Bot" />

₍₍⚞(˶>⩊<˶)⚟⁾⁾ Nya~! Oi! Vim te ajudar a me instalar no Termux — segue o guia passo a passo que tudo vai dar certo e daqui a pouco eu tô online! ✨

</div>

---

## 📋 Antes de começar

> Você vai precisar do **Termux** instalado no seu Android. Se ainda não tem, baixe pela **[F-Droid](https://f-droid.org/packages/com.termux/)** — a versão da Play Store está desatualizada e vai causar erros na instalação. Não diga que eu não avisei, ok? 🐰

---

## 🪄 Passo a Passo 

<br/>

### 1. Atualizar os pacotes do Termux

Atualiza os repositórios e pacotes do sistema. Necessário para evitar conflitos de versão durante a instalação.

```bash
pkg update && pkg upgrade -y
```

<br/>

### 2. Instalar as dependências do sistema

Instala as ferramentas que o bot precisa para funcionar: `git`, `nodejs`, `ffmpeg`, `imagemagick` e `yt-dlp` (esse último é quem baixa os vídeos dos comandos `/yt`, `/pin`, `/insta` e `/tiktok`).

```bash
pkg install git nodejs ffmpeg imagemagick yt-dlp -y
```

<br/>

### 3. Instalar o exibidor de QR Code

Instala globalmente o pacote responsável por renderizar o QR Code direto no terminal na primeira execução.

```bash
npm install -g qrcode-terminal
```

<br/>

### 4. Clonar o repositório

Baixa o código-fonte do bot do GitHub para o seu dispositivo.

```bash
git clone https://github.com/BunnyGhost/Hermione-Bot.git
```

<br/>

### 5. Entrar na pasta do projeto

Todos os comandos seguintes devem ser executados dentro deste diretório.

```bash
cd Hermione-Bot
```

<br/>

### 6. Instalar os módulos — primeira passagem

O Termux restringe a execução de scripts nativos durante o `npm install`. Esta flag contorna isso e evita erros de compilação.

```bash
npm install --ignore-scripts
```

<br/>

### 7. Instalar os módulos — passagem completa

Conclui a instalação de todas as dependências do projeto.

```bash
npm install
```

<br/>

### 8. Iniciar o bot

```bash
npm start
```

Na primeira execução, um QR Code será exibido no terminal. Escaneie pelo WhatsApp em **Dispositivos vinculados → Vincular um dispositivo**. Da segunda vez em diante, a conexão é feita automaticamente. ✅

> 💡 **Dica:** o Android costuma "dormir" o Termux quando a tela apaga, e aí eu fico offline. Para evitar isso, rode `termux-wake-lock` **antes** do `npm start` (ou use a opção *Acquire wakelock* na notificação do Termux).

---

## ⚡ Com pressa? Tudo de uma vez!?

<div align="center">
  <img src="https://99px.ru/sstorage/86/2020/09/12309201428524836.gif" width="400" alt="Hermione com pressa" />
</div>

<br/>

*Tá sem paciência pra copiar um por um? Eu entendo, eu entendo... 😤*  
*Copia esse bloco gigante e cola no Termux de uma vez — eu cuido do resto!*

```bash
pkg update && pkg upgrade -y && \
pkg install git nodejs ffmpeg imagemagick yt-dlp -y && \
npm install -g qrcode-terminal && \
git clone https://github.com/BunnyGhost/Hermione-Bot.git && \
cd Hermione-Bot && \
npm install --ignore-scripts && \
npm install && \
npm start
```

> ⚠️ Se algum comando travar ou pedir confirmação no meio do processo, digita `y` e aperta Enter — é só o Termux sendo dramático, hehe~

- ☕ Pode demorar um pouquinho já que está fazendo tudo de uma vez — relaxa e aguarda!

<div align="center">
  <img src="https://preview.redd.it/recommendation-for-kaguya-sama-love-is-war-fans-teasing-v0-nshjrut1ooa51.gif?width=498&auto=webp&s=7fcd7dc194bb2d24efe677a5dc1e59f9a7629d32" width="400" alt="Esperando..." />
</div>




## 📦 O que está sendo instalado?

*Curiosinha, hein? Tudo bem, eu explico direitinho o que cada coisa faz!*

| Pacote | Pra que serve |
|---|---|
| `git` | Clona repositórios do GitHub pro seu dispositivo |
| `nodejs` | Runtime JavaScript — o motor que me faz funcionar |
| `ffmpeg` | Processa e converte áudios e vídeos |
| `imagemagick` | Manipula imagens e gera figurinhas ✨ |
| `yt-dlp` | Baixa os vídeos do YouTube, Pinterest, Instagram e TikTok (`/yt` `/pin` `/insta` `/tiktok`) 📥 |
| `qrcode-terminal` | Renderiza o QR Code direto no terminal para vincular o WhatsApp |

---

## 🌺 Problemas? Fica calmo!

<details>
<summary><b>⚠️ "command not found" após instalar o Node.js</b></summary>
<br/>

Feche e reabra o Termux para recarregar as variáveis de ambiente, depois tente novamente. Se persistir:

```bash
pkg reinstall nodejs
```

</details>

<details>
<summary><b>⚠️ npm install trava ou dá erro de compilação</b></summary>
<br/>

Instale as ferramentas de build nativas e tente novamente:

```bash
pkg install python make clang -y
npm install
```

</details>

<details>
<summary><b>⚠️ QR Code não aparece ou some muito rápido</b></summary>
<br/>

Delete a sessão salva e reinicie:

```bash
rm -rf auth_info_baileys/
npm start
```

</details>

<details>
<summary><b>⚠️ Os downloads (/yt, /pin, /insta, /tiktok) não funcionam</b></summary>
<br/>

Confirme que o yt-dlp está instalado e atualizado (os sites mudam e versões antigas quebram):

```bash
yt-dlp --version
pkg upgrade yt-dlp -y
```

Se aparecer "command not found", instale com:

```bash
pkg install yt-dlp -y
```

Se der "package not found", rode `pkg update` e tente de novo.

</details>

<details>
<summary><b>⚠️ O bot fica offline quando a tela do celular apaga</b></summary>
<br/>

O Android pausa apps em segundo plano para economizar bateria. Antes de iniciar o bot, rode:

```bash
termux-wake-lock
npm start
```

Se ainda assim ele cair, nas configurações do Android desative a **otimização de bateria** para o Termux.

</details>

---

<div align="center">
  <p><i>✨ Obrigada pela preferência — foi um prazer te guiar até aqui! ✨</i></p>
  <img src="https://i.pinimg.com/originals/3c/bd/17/3cbd17367fe4a8af86308840a931a73a.gif" width="600" alt="Agradecimento" />
</div>
