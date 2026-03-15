<div align="center">

<img src="https://i.pinimg.com/originals/37/d7/29/37d729ae35622b8fc8de12835a502dec.gif" width="260" alt="Hermione Bot" />

# ✦ Hermione Bot ✦

<p align="center">
  <i>Nya~! Olá, eu sou a Hermione!</i><br/>
Sua assistente para WhatsApp: stickers, revelação de mídias e várias utilidades. 
</p>

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=bd93f9)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-Multi--Device-25D366?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=bd93f9)](https://github.com/WhiskeySockets/Baileys)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black&labelColor=bd93f9)](https://github.com/BunnyGhost/Hermione-Bot)
[![License](https://img.shields.io/badge/License-MIT-FF79C6?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=bd93f9)](LICENSE)
[![Stars](https://img.shields.io/github/stars/BunnyGhost/Hermione-Bot?style=for-the-badge&logo=starship&logoColor=white&labelColor=bd93f9&color=FF79C6)](https://github.com/BunnyGhost/Hermione-Bot/stargazers)


</div>

---

## 🌸 O que é a Hermione Bot?

**Hermione Bot** é uma assistente para WhatsApp com personalidade inspirada em animes, fofa, eficiente e repleta de funcionalidades. Desenvolvida com [Baileys](https://github.com/WhiskeySockets/Baileys), conecta direto ao seu WhatsApp **sem API paga, sem número extra e sem burocracia**. Só o QR Code e a magia começa. ✨
Ela cria **stickers** instantâneos, revela **mídias de visualização única**, expõe a **foto de perfil de qualquer membro de grupo**, realiza **consultas OSINT de IP com geolocalização** e muito mais, tudo via comandos simples no chat.

É o projeto ideal para quem busca automatizar tarefas, gerenciar grupos ou simplesmente ter uma assistente inteligente para uso pessoal.

> [!TIP]
>  Nunca programou antes? Sem pânico. Este README foi escrito pensando em você. Siga os passos na ordem e tudo vai funcionar. O código também está comentado intencionalmente para facilitar o entendimento. ~

---

# 📖 Sumário

<table>
<tr>
<td valign="top">

| `#` | Seção | Descrição |
|:---:|:---|:---|
| `01` | **[Instalação de Dependências](#-passo-1--instalar-as-dependências)** | Instalando Node.js, Git e npm do zero |
| `02` | **[Baixar o Projeto](#-passo-2--baixar-o-projeto)** | Clonando o repositório e instalando os pacotes |
| `03` | **[Iniciar a Hermione](#️-passo-3--iniciar-a-hermione)** | Rodando o bot e conectando via QR Code |
| `04` | **[Configuração](#️-configuração)** | Prefixo, nome do bot e imagens necessárias |
| `05` | **[Recursos](#-recursos)** | Tudo que a Hermione é capaz de fazer |
| `06` | **[Comandos](#-comandos)** | Lista completa de comandos disponíveis |
| `07` | **[Estrutura do Projeto](#-estrutura-do-projeto)** | Organização de pastas e arquivos |
| `08` | **[Manter Online 24/7](#-manter-o-bot-online-247)** | Rodando em segundo plano com PM2 |
| `09` | **[Resetar Sessão](#-resetar-a-sessão)** | Deslogar e conectar outra conta |
| `10` | **[Solução de Problemas](#-solução-de-problemas)** | Erros comuns e como resolver |
| `11` | **[Como Contribuir](#-como-contribuir)** | Fork, branch e Pull Request |
| `12` | **[Contato e Suporte](#-contato-e-suporte)** | GitHub e reportar bugs |
</td>
 <tr>
    <td align="center" valign="middle">
      <img src="https://i.pinimg.com/originals/0d/38/be/0d38be44cc641fc070b6bfb5c5faded7.gif" width="50%" alt="Hermione Bot" />
    </td>
  </tr>
</tr>
</table>

## 🍬 Passo 1 — Instalar as Dependências

> Essas são as ferramentas que precisam estar instaladas no seu computador **antes** de qualquer coisa.  
> Se já tiver tudo instalado, pode pular direto para o [Passo 2 — Baixar o Projeto](#-passo-2--baixar-o-projeto).

<br/>

### O que você vai precisar

| Ferramenta | Versão mínima | Como baixar |
|---|---|---|
| **Node.js** | v18 ou superior *(v20 recomendado)* | [nodejs.org/pt](https://nodejs.org/pt) |
| **Git** | Qualquer versão recente | [git-scm.com](https://git-scm.com) |
| **npm** | v9 ou superior | ✅ Já vem junto com o Node.js |
| **WhatsApp** | Conta ativa no celular | — |

<br/>

### Como abrir o terminal

Não sabe o que é terminal? É aquela tela preta onde você digita comandos.

- **Windows** → Pressione `Win + R`, digite `cmd` e clique em **OK**
- **Mac** → Pesquise por **Terminal** no Spotlight (`Cmd + Espaço`)
- **Linux** → `Ctrl + Alt + T`

<br/>

### 1. Instalar o Node.js

**Windows / Mac** → Acesse [nodejs.org/pt](https://nodejs.org/pt), baixe a versão **LTS** e siga o instalador normalmente até o final.

> O npm já é instalado junto com o Node.js — você não precisa instalar separado. ✅

<details>
<summary>🐧 <b>Linux — instalar pelo terminal</b></summary>

<br/>

```bash
# Debian / Ubuntu / Mint
sudo apt update && sudo apt install -y nodejs npm

# Arch / Manjaro
sudo pacman -S nodejs npm

# Fedora
sudo dnf install nodejs npm
```

> ⚠️ O gerenciador de pacotes da sua distro pode instalar uma versão desatualizada do Node.js. Se a versão instalada for menor que v18, veja a seção [Solução de Problemas](#-solução-de-problemas) para instalar via NVM.

</details>

<br/>

### 2. Instalar o Git

**Windows / Mac** → Acesse [git-scm.com](https://git-scm.com/downloads), baixe a versão para o seu sistema e siga o instalador com as opções padrão.

<details>
<summary>🐧 <b>Linux — instalar pelo terminal</b></summary>

<br/>

```bash
# Debian / Ubuntu / Mint
sudo apt update && sudo apt install -y git

# Arch / Manjaro
sudo pacman -S git

# Fedora
sudo dnf install git
```

</details>

<br/>

### 3. Verificar se está tudo certo

Com o terminal aberto, cole esses comandos **um por vez** e pressione `Enter` após cada um:

```bash
node -v
```

```bash
npm -v
```

```bash
git --version
```

Se aparecer um número de versão em cada um, como nos exemplos abaixo, está tudo certo! ✅

```
v20.11.0            ← node -v
10.2.4              ← npm -v
git version 2.43.0  ← git --version
```

Se aparecer **"comando não encontrado"** ou **"is not recognized"**, a ferramenta não foi instalada corretamente — volte e reinstale antes de continuar.

<br/>

---

<br/>

## 📦 Passo 2 — Baixar o Projeto

> Siga os passos **na ordem**. Cada um depende do anterior!

<br/>

### 1. Clonar o repositório

> "Clonar" significa baixar uma cópia do projeto para o seu computador.

```bash
git clone https://github.com/BunnyGhost/Hermione-Bot.git
```

<br/>

### 2. Entrar na pasta

```bash
cd Hermione-Bot
```

> Agora o seu terminal está "dentro" da pasta do projeto. Todos os próximos comandos devem ser executados aqui.

<br/>

### 3. Instalar as dependências do projeto

> "Dependências" são as bibliotecas externas que o bot precisa para funcionar. O npm vai baixar tudo automaticamente.

```bash
npm install
```

Pode demorar alguns minutos dependendo da sua internet. Quando terminar, uma pasta `node_modules` vai aparecer — isso é **completamente normal**. ✅

<br/>

<details>
<summary>📋 O que está sendo instalado?</summary>

<br/>

| Pacote | Para que serve |
|---|---|
| `@whiskeysockets/baileys` | Motor principal — conecta ao WhatsApp Multi-Device |
| `wa-sticker-formatter` | Cria e formata as figurinhas |
| `sharp` | Processa imagens (redimensionar, converter, etc.) |
| `fluent-ffmpeg` | Processa vídeos e áudios |
| `qrcode-terminal` | Exibe o QR Code de login no terminal |
| `pino` | Sistema de logs — mantém o terminal limpo |
| `baileys_helpers` | Utilitários para botões interativos |
| `axios` | Faz requisições HTTP para APIs externas |
| `nodemon` | *(dev)* Reinicia o bot automaticamente ao salvar arquivos |

</details>

<br/>

---

<br/>

## ▶️ Passo 3 — Iniciar a Hermione

<br/>

### Modo normal (recomendado)

```bash
npm start
```

### Modo desenvolvimento *(reinicia sozinha ao editar o código)*

```bash
npm run dev
```

<br/>

### Primeira conexão — QR Code

Na primeira vez que rodar, a Hermione vai exibir um QR Code no terminal:

```
==================================================
📱 ESCANEIE O QR CODE PARA CONECTAR O BOT:
==================================================
[QR Code aparece aqui]
==================================================
```

**Siga esses passos para conectar:**

```
① Abra o WhatsApp no celular

② Android  →  toque nos ⋮ três pontinhos  →  Dispositivos vinculados
   iPhone   →  Configurações  →  Dispositivos vinculados

③ Toque em "Vincular um dispositivo"

④ Aponte a câmera para o QR Code no terminal
```

Após escanear, o terminal vai exibir o banner e começar a logar as mensagens em tempo real:

```
██╗  ██╗███████╗██████╗ ███╗   ███╗██╗ ██████╗ ███╗   ██╗███████╗
██║  ██║██╔════╝██╔══██╗████╗ ████║██║██╔═══██╗████╗  ██║██╔════╝
███████║█████╗  ██████╔╝██╔████╔██║██║██║   ██║██╔██╗ ██║█████╗
██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║   ██║██║╚██╗██║██╔══╝
██║  ██║███████╗██║  ██║██║ ╚═╝ ██║██║╚██████╔╝██║ ╚████║███████╗
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

              Bot WhatsApp by Bunny Ghost

  🟢 CONECTADO COM SUCESSO!
  🤖 Bot pronto para receber mensagens!
```
```
──────────────────────────────────────────────────────────────────────
  [Hora]      Origem    Nome              Telefone        →  Mensagem
──────────────────────────────────────────────────────────────────────
[14:23:01]  Privado   Maria Silva       5511999999999   →  Oi Hermione! Tudo bem?
[14:23:05]  Grupo     Amigos da Facu    5511888888888   →  Alguém viu o dever?
[14:23:12]  Botão     João Pedro        5511777777777   →  /menu
[14:23:15]  Privado   Você              5511999999999   →  /s
```

 ## Pronto agora Hermione Bot já esta rodando!
 
<p align="center">
  <img 
    src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWN5OGU0cDFxN2YweHk1OWU0NG4xaXJxcGtxbmJwbGM2d2wwYjJtZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LML5ldpTKLPelFtBfY/giphy.webp" 
    alt="Rodando"
    style="max-width:100%; height:auto; border-radius:10px;"
  />
</p>

> ✅ **Da segunda vez em diante**, a Hermione se conecta sozinha — sem precisar escanear de novo! A sessão fica salva na pasta `auth_info_baileys/`.

> 💡 Todos os logs são coloridos no terminal graças ao `chalk` — fica fácil de acompanhar tudo em tempo real!

Se a conexão cair, o bot tenta se reconectar automaticamente:

```
Conexão encerrada. Reconectando em 3s...
```

**Para encerrar o bot:** pressione `Ctrl + C` no terminal.

* Agora vamos para a parte teórica da configuração para entender melhor tudo o que está acontecendo. Não se preocupe se parecer muita informação no início. Organizei o conteúdo da forma mais intuitiva possível. Leia com atenção, pois esse conhecimento pode ajudar caso algo dê errado e você precise resolver sozinho hehe. então leia

  <p align="center">
  <img 
    src="https://media1.tenor.com/m/y9uy-tXR7QUAAAAd/adult-magazine-chika.gif" 
    alt="Demo do projeto"
    style="max-width:100%; height:auto; border-radius:10px;"
  />
</p>

<br>

## ⚙️ Configuração

Abra o arquivo `src/config.js` em qualquer editor de texto (Notepad, VS Code, etc.) e edite:

```js
module.exports = {
  PREFIX:   "/",                               // caractere que ativa os comandos
  DONO:     "Bunny Ghost",                     // seu nome ou apelido
  BOT_NAME: "Hermione",                        // nome da bot
  GITHUB:   "https://github.com/BunnyGhost"   // seu GitHub
};
```

<br/>

**O que é o `PREFIX`?**

É o caractere que você digita antes de cada comando para que a Hermione responda.

| PREFIX configurado | Exemplo de uso |
|---|---|
| `/` *(padrão)* | `/menu`, `/s`, `/ping` |
| `!` | `!menu`, `!s`, `!ping` |
| `.` | `.menu`, `.s`, `.ping` |

<br/>

**Imagens necessárias**

A pasta `src/assets/` precisa ter esses arquivos:

```
src/assets/
├── menu2.jpg     →  imagem exibida no /menu
├── flor1.jpeg    →  thumbnail do link preview
└── image.png     →  foto de apresentação do /bot
```

> ⚠️ Você pode trocar por qualquer imagem que quiser — só mantenha os mesmos nomes de arquivo!

<br/>

---

<br/>

## ✨ Recursos

| | Recurso | Descrição |
|---|---|---|
| 🖼️ | **Stickers instantâneos** | Transforma qualquer imagem em figurinha do WhatsApp |
| 🔓 | **Desbloqueio de mídias** | Visualiza fotos e vídeos de "ver uma vez" normalmente |
| 🌀 | **Botões interativos** | Menus clicáveis nativos do WhatsApp |
| 🎵 | **Envio de áudio** | Envia áudios direto pelo bot |
| 👤 | **Info de usuário** | Mostra dados do contato ou do grupo |
| 📇 | **Envio de contato** | Compartilha contatos no formato vCard |
| 🔮 | **Texto invisível** | Mensagens com caracteres ocultos |
| 🎨 | **Painel no terminal** | Interface colorida com logs em tempo real |
| ⚡ | **Reconexão automática** | Se cair, reconecta sozinha |
| 🧩 | **Modular e extensível** | Fácil de adicionar novos comandos |

<br/>

---

<br/>

## 🔮 Comandos

> Prefixo padrão: `/` — alterável em `src/config.js`

| Comando | O que faz |
|---|---|
| `/bot` | Apresentação da Hermione com menu de botões interativos |
| `/menu` | Exibe o menu visual completo com imagem |
| `/ping` | Mede a velocidade de resposta do bot |
| `/s` | Converte a imagem enviada em figurinha |
| `/au` | Envia um áudio pelo bot |
| `/hidden` | Envia mensagem com caracteres invisíveis |
| `/who` | Mostra informações do seu perfil ou do grupo |
| `/ctt` | Envia um contato no formato vCard |
| `/infos` | Informações técnicas sobre o bot |

<br/>

---

<br/>

## 📂 Estrutura do Projeto

```
Hermione-Bot/
│
├── src/
│   │
│   ├── index.js                ← 🚀 ponto de entrada — inicializa tudo
│   ├── config.js               ← ⚙️  configurações globais (prefix, nome, etc.)
│   │
│   ├── assets/                 ← 🖼️  imagens usadas pelos comandos
│   │   ├── menu2.jpg
│   │   ├── flor1.jpeg
│   │   └── image.png
│   │
│   └── commands/               ← 🔮 cada arquivo = um comando
│       ├── audio.js            ←    /au
│       ├── buttonHandler.js    ←    captura cliques em botões
│       ├── ctt.js              ←    /ctt
│       ├── hidden.js           ←    /hidden
│       ├── info.js             ←    /infos
│       ├── menu.js             ←    /menu
│       ├── sticker.js          ←    /s
│       └── who.js              ←    /who
│
├── auth_info_baileys/          ← 🔐 sessão salva (gerada automaticamente)
├── package.json                ← 📦 dependências e scripts npm
└── .gitignore                  ← 🙈 arquivos ignorados pelo Git
```

<br/>

---

<br/>

## 🚀 Manter o Bot Online 24/7

Por padrão, o bot fica online enquanto o terminal estiver aberto. Para deixá-lo rodando em segundo plano, use o **PM2**.

**Instalar o PM2:**

```bash
npm install -g pm2
```

**Iniciar a Hermione com PM2:**

```bash
pm2 start src/index.js --name hermione-bot
```

**Comandos de gerenciamento:**

```bash
pm2 list                      # lista todos os processos ativos
pm2 logs hermione-bot         # exibe os logs em tempo real
pm2 restart hermione-bot      # reinicia o bot
pm2 stop hermione-bot         # para o bot
pm2 delete hermione-bot       # remove o processo da lista
pm2 startup                   # configura para iniciar com o sistema
```

> 💡 Para hospedar na nuvem, serviços como **Railway**, **Render** ou qualquer **VPS Linux** funcionam perfeitamente. O PM2 não é necessário nesses casos — o próprio serviço gerencia o processo.

<br/>

---

<br/>

## 🌙 Resetar a Sessão

Precisa deslogar e conectar outra conta? Delete a pasta de sessão:

```bash
# Linux / macOS
rm -rf auth_info_baileys/

# Windows — PowerShell
Remove-Item -Recurse -Force auth_info_baileys

# Windows — Prompt de Comando (cmd)
rmdir /s /q auth_info_baileys
```

Depois rode `npm start` e escaneie o novo QR Code normalmente. ✨

<br/>

---

<br/>

## 🌺 Solução de Problemas

<details>
<summary><b>⚠️ QR Code não aparece ou a conexão falha</b></summary>
<br/>

- Verifique sua conexão com a internet
- Confirme que o Node.js está na versão 18 ou superior: `node -v`
- Delete a pasta `auth_info_baileys/` e tente novamente

</details>

<details>
<summary><b>⚠️ Erro ao criar figurinha com /s</b></summary>
<br/>

O comando depende do `sharp`, que pode precisar de configuração extra:

```bash
# Reinstalar o sharp
npm install sharp

# Linux — instalar dependência nativa
sudo apt-get install libvips-dev
```

</details>

<details>
<summary><b>⚠️ "Cannot find module" ao iniciar</b></summary>
<br/>

As dependências não foram instaladas corretamente. Rode:

```bash
npm install
```

Se o erro persistir, delete `node_modules` e reinstale do zero:

```bash
# Linux / macOS
rm -rf node_modules && npm install

# Windows
rmdir /s /q node_modules && npm install
```

</details>

<details>
<summary><b>⚠️ Bot para de responder depois de um tempo</b></summary>
<br/>

- Verifique se o celular com o WhatsApp conectado está com internet
- Delete `auth_info_baileys/` e reconecte via QR Code
- Se estiver usando PM2: `pm2 restart hermione-bot`

</details>

<details>
<summary><b>⚠️ "Session Closed" ou "Logged Out"</b></summary>
<br/>

Ocorre quando o WhatsApp encerra a sessão remotamente (ex: você usou o WhatsApp Web em outro lugar). Para resolver:

```bash
rm -rf auth_info_baileys/
npm start
```

</details>

<details>
<summary><b>🐧 Linux — versão do Node.js menor que v18 (instalar via NVM)</b></summary>
<br/>

Se o gerenciador de pacotes da sua distro instalou uma versão antiga do Node.js, use o **NVM** (Node Version Manager) para instalar a versão correta:

**Instalar o NVM:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Após a instalação, feche e reabra o terminal (ou rode `source ~/.bashrc`), depois instale o Node.js:

```bash
# Instala a versão LTS mais recente
nvm install --lts

# Define ela como padrão
nvm use --lts
```

Confirme que agora está na versão correta:

```bash
node -v
# deve exibir v20.x.x ou superior
```

> Prefere usar o gerenciador de pacotes da sua distro? Funciona também, mas pode instalar uma versão desatualizada.
> ⚠️ Se a versão instalada for menor que v18, use o NVM mesmo — é mais seguro.

</details>

<br/>

---

<br/>

## 🤝 Como Contribuir

Encontrou um bug? Quer adicionar um novo comando? Contribuições são muito bem-vindas! ✨

```bash
# 1. Faça um fork do repositório pelo GitHub

# 2. Clone o seu fork
git clone https://github.com/SEU_USUARIO/Hermione-Bot.git
cd Hermione-Bot

# 3. Crie uma branch para a sua feature
git checkout -b feat/nome-da-feature

# 4. Faça suas alterações e registre o commit
git commit -m "feat: descrição do que foi adicionado"

# 5. Envie para o GitHub
git push origin feat/nome-da-feature

# 6. Abra um Pull Request no repositório original
```

<br/>

---

<br/>

## 📬 Contato e Suporte

- 🐙 **GitHub:** [github.com/BunnyGhost](https://github.com/BunnyGhost)
- 🐛 **Reportar bug:** [Abrir uma issue](https://github.com/BunnyGhost/Hermione-Bot/issues/new)

<br/>

---

<br/>

---


## 💜 Agradecimentos & Considerações Finais

A Hermione Bot só existe graças à incrível comunidade open source que transforma ideias em realidade — tudo isso de graça e com muito carinho.

**Um obrigado gigante e sincero vai para:**

- Todos os mantenedores e contribuidores que mantêm projetos vivos por pura paixão
- A equipe do **Baileys** (e suas forks incansáveis) — os verdadeiros magos por trás da conexão sem API paga
- Os criadores de **wa-sticker-formatter**, **sharp**, **fluent-ffmpeg**, **axios** e tantas outras bibliotecas que dão vida às figurinhas, vídeos e respostas instantâneas
- Toda a comunidade **Node.js / JavaScript**, que mantém esse ecossistema poderoso, atualizado e acessível a todos
- E especialmente a **você**, que chegou até aqui, testou, usou, deu estrela ou apenas sorriu com uma resposta da Hermione ♡

<br/>

> Projetos como esse sobrevivem porque existem pessoas que compartilham conhecimento, corrigem bugs às 3 da manhã e mantêm repositórios pulsando por amor (e um pouquinho de teimosia saudável).

<br/>

Espero que as explicações tenham sido claras e fáceis de seguir. Sempre priorizo simplificar ao máximo e adicionar **muitos comentários no código** para que qualquer pessoa (mesmo quem está começando agora) consiga entender cada linha e se sentir confortável para mexer.

Obrigado de coração por terem acompanhado, testado, quebrado coisas e comemorado cada acerto até aqui.

**Agora é a sua vez de fazer mágica:**

- mexa no código sem medo
- crie variações (quanto mais loucas, melhor)
- transforme o que aprendeu em bots, comandos e ideias só suas

<br/>

*Divirtam-se bastante no processo (mas tentem dormir um pouco também, hein? 😅)*

**Bons estudos e até a próxima, guys!**
Abraços!

<br>

<div align="center">
<img src="https://i.pinimg.com/originals/12/6d/d5/126dd5b980a0d0a4af54e309fa74190d.gif" width="70%" alt="Hermione Bot" />
</div>
