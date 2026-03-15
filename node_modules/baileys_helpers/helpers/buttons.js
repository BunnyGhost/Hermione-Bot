import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export class InteractiveValidationError extends Error {
  constructor(message, { context, errors = [], warnings = [], example } = {}) {
    super(message);
    this.name = 'InteractiveValidationError';
    this.context = context;
    this.errors = errors;
    this.warnings = warnings;
    this.example = example;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      errors: this.errors,
      warnings: this.warnings,
      example: this.example
    };
  }

  formatDetailed() {
    const lines = [
      `[${this.name}] ${this.message}${this.context ? ' (' + this.context + ')' : ''}`
    ];

    if (this.errors?.length) {
      lines.push('Errors:');
      this.errors.forEach(e => lines.push('  - ' + e));
    }

    if (this.warnings?.length) {
      lines.push('Warnings:');
      this.warnings.forEach(w => lines.push('  - ' + w));
    }

    if (this.example) {
      lines.push('Example payload:', JSON.stringify(this.example, null, 2));
    }

    return lines.join('\n');
  }
}

const EXAMPLE_PAYLOADS = {
  sendButtons: {
    text: 'Pilih opsi',
    buttons: [
      { id: 'opt1', text: 'Opsi 1' },
      { id: 'opt2', text: 'Opsi 2' },
      { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Kunjungi Situs', url: 'https://api.whatsapp.com/send?phone=6285655548594' }) }
    ],
    footer: 'Teks footer'
  },
  hydratedTemplate: {
    image: { url: "https://www.himmel.web.id/image.png" },
    text: 'Pilih aksi',
    interactiveButtons: [
      { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Halo', id: 'hello' }) },
      { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Salin Kode', copy_code: 'ABC123' }) }
    ],
    footer: 'Footer',
    contextInfo: {
        mentionedJid: ["123456789@s.whatsapp.net"],
        externalAdReply: {
            title: "Example Ad",
            body: "This is an example",
            thumbnailUrl: "https://www.himmel.web.id/image.png",
            sourceUrl: "https://www.himmel.web.id"
        }
    }
  }
};

const SEND_BUTTONS_ALLOWED_COMPLEX = new Set(['cta_url', 'cta_copy', 'cta_call']);
const INTERACTIVE_ALLOWED_NAMES = new Set([
  'quick_reply', 'cta_url', 'cta_copy', 'cta_call', 'cta_catalog', 'cta_reminder', 'cta_cancel_reminder',
  'address_message', 'send_location', 'open_webview', 'mpm', 'wa_payment_transaction_details',
  'automated_greeting_message_view_catalog', 'galaxy_message', 'single_select'
]);

const REQUIRED_FIELDS_MAP = {
  cta_url: ['display_text', 'url'],
  cta_copy: ['display_text', 'copy_code'],
  cta_call: ['display_text', 'phone_number'],
  cta_catalog: ['business_phone_number'],
  cta_reminder: ['display_text'],
  cta_cancel_reminder: ['display_text'],
  address_message: ['display_text'],
  send_location: ['display_text'],
  open_webview: ['title', 'link'],
  mpm: ['product_id'],
  wa_payment_transaction_details: ['transaction_id'],
  automated_greeting_message_view_catalog: ['business_phone_number', 'catalog_product_id'],
  galaxy_message: ['flow_token', 'flow_id'],
  single_select: ['title', 'sections'],
  quick_reply: ['display_text', 'id']
};

let internalLogger = console;

export function setLogger(logger) {
  if (logger) {
    internalLogger = logger;
  }
}

function parseButtonParams(name, buttonParamsJson, errors, warnings, index) {
  let parsed;
  try {
    parsed = JSON.parse(buttonParamsJson);
  } catch (e) {
    errors.push(`button[${index}] (${name}) JSON tidak valid: ${e.message}`);
    return null;
  }

  const req = REQUIRED_FIELDS_MAP[name] || [];
  for (const f of req) {
    if (!(f in parsed)) {
      errors.push(`button[${index}] (${name}) field wajib '${f}' tidak ditemukan`);
    }
  }

  if (name === 'open_webview' && parsed.link) {
    if (typeof parsed.link !== 'object' || !parsed.link.url) {
      errors.push(`button[${index}] (open_webview) link.url diperlukan`);
    }
  }

  if (name === 'single_select') {
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      errors.push(`button[${index}] (single_select) sections harus berupa array tidak kosong`);
    }
  }

  return parsed;
}

function buildInteractiveButtons(buttons = []) {
  return buttons.map((b, i) => {
    if (b && b.name && b.buttonParamsJson) {
      internalLogger.debug(`[baileys_helpers] buildInteractiveButtons: Tombol[${i}] sudah dalam format native: ${b.name}`);
      return b;
    }

    if (b && (b.id || b.text)) {
      internalLogger.debug(`[baileys_helpers] buildInteractiveButtons: Tombol[${i}] dikonversi dari format legacy (id/text) ke quick_reply`);
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || b.displayText || 'Tombol ' + (i + 1),
          id: b.id || ('quick_' + (i + 1))
        })
      };
    }

    if (b && b.buttonId && b.buttonText?.displayText) {
      internalLogger.debug(`[baileys_helpers] buildInteractiveButtons: Tombol[${i}] dikonversi dari format buttonsMessage (buttonId/buttonText) ke quick_reply`);
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.buttonText.displayText,
          id: b.buttonId
        })
      };
    }
    
    internalLogger.warn(`[baileys_helpers] buildInteractiveButtons: Tombol[${i}] tidak dapat dikenali formatnya.`);
    return b;
  });
}

export function validateAuthoringButtons(buttons) {
  const errors = [];
  const warnings = [];

  if (buttons == null) {
    return { errors: [], warnings: [], valid: true, cleaned: [] };
  }

  if (!Array.isArray(buttons)) {
    errors.push('buttons harus berupa array');
    return { errors, warnings, valid: false, cleaned: [] };
  }

  const SOFT_BUTTON_CAP = 25;
  if (buttons.length === 0) {
    warnings.push('array buttons kosong');
  } else if (buttons.length > SOFT_BUTTON_CAP) {
    warnings.push(`jumlah buttons (${buttons.length}) melebihi batas ${SOFT_BUTTON_CAP}; mungkin akan ditolak oleh klien`);
  }

  const cleaned = buttons.map((b, idx) => {
    if (b == null || typeof b !== 'object') {
      errors.push(`button[${idx}] bukan objek`);
      return b;
    }

    if (b.name && b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        errors.push(`button[${idx}] buttonParamsJson harus berupa string`);
      } else {
        try {
          JSON.parse(b.buttonParamsJson);
        } catch (e) {
          errors.push(`button[${idx}] buttonParamsJson bukan JSON valid: ${e.message}`);
        }
      }
      return b;
    }

    if (b.id || b.text || b.displayText) {
      if (!(b.id || b.text || b.displayText)) {
        errors.push(`button[${idx}] bentuk legacy tidak memiliki id atau text/displayText`);
      }
      return b;
    }

    if (b.buttonId && b.buttonText && typeof b.buttonText === 'object' && b.buttonText.displayText) {
      return b;
    }

    if (b.buttonParamsJson) {
      if (typeof b.buttonParamsJson !== 'string') {
        warnings.push(`button[${idx}] memiliki buttonParamsJson non-string; akan mencoba stringify`);
        try {
          b.buttonParamsJson = JSON.stringify(b.buttonParamsJson);
        } catch {
          errors.push(`button[${idx}] buttonParamsJson tidak dapat diserialisasi`);
        }
      } else {
        try { JSON.parse(b.buttonParamsJson); } catch (e) { warnings.push(`button[${idx}] buttonParamsJson bukan JSON valid (${e.message})`); }
      }
      if (!b.name) {
        warnings.push(`button[${idx}] tidak memiliki nama; menggunakan default quick_reply`);
        b.name = 'quick_reply';
      }
      return b;
    }

    warnings.push(`button[${idx}] bentuk tidak dikenali; diteruskan tanpa perubahan`);
    return b;
  });

  return { errors, warnings, valid: errors.length === 0, cleaned };
}

export function validateSendButtonsPayload(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload harus berupa objek'], warnings };
  }

  if (!data.text || typeof data.text !== 'string') {
    errors.push('text wajib dan harus berupa string');
  }

  if (!Array.isArray(data.buttons) || data.buttons.length === 0) {
    errors.push('buttons wajib dan harus berupa array tidak kosong');
  } else {
    data.buttons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`button[${i}] harus berupa objek`);
        return;
      }

      if (btn.id && btn.text) {
        if (typeof btn.id !== 'string' || typeof btn.text !== 'string') {
          errors.push(`button[${i}] id/text legacy quick reply harus berupa string`);
        }
        return;
      }

      if (btn.name && btn.buttonParamsJson) {
        if (!SEND_BUTTONS_ALLOWED_COMPLEX.has(btn.name)) {
          errors.push(`button[${i}] nama '${btn.name}' tidak diizinkan dalam sendButtons`);
          return;
        }

        if (typeof btn.buttonParamsJson !== 'string') {
          errors.push(`button[${i}] buttonParamsJson harus berupa string`);
          return;
        }

        parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i);
        return;
      }

      errors.push(`button[${i}] bentuk tidak valid (harus legacy quick reply atau bernama ${Array.from(SEND_BUTTONS_ALLOWED_COMPLEX).join(', ')})`);
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateSendButtonMsgPayload(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['payload harus berupa objek'], warnings };
  }

  const hasMedia = data.image || data.video || data.document;
  const hasHeader = data.title || data.subtitle;
  const hasText = data.text && typeof data.text === 'string';

  if (!hasMedia && !hasHeader && !hasText) {
      errors.push('payload harus memiliki salah satu dari: image, video, document, title, subtitle, atau text');
  }

  if (hasMedia && hasHeader) {
      warnings.push('title/subtitle diabaikan karena media (image/video/document) disediakan untuk header');
  }

  if (!data.interactiveButtons || !Array.isArray(data.interactiveButtons) || data.interactiveButtons.length === 0) {
    errors.push('interactiveButtons wajib dan harus berupa array tidak kosong');
  } else {
    data.interactiveButtons.forEach((btn, i) => {
      if (!btn || typeof btn !== 'object') {
        errors.push(`interactiveButtons[${i}] harus berupa objek`);
        return;
      }

      if (!btn.name || typeof btn.name !== 'string') {
        errors.push(`interactiveButtons[${i}] nama tidak ditemukan`);
        return;
      }

      if (!INTERACTIVE_ALLOWED_NAMES.has(btn.name)) {
        errors.push(`interactiveButtons[${i}] nama '${btn.name}' tidak diizinkan`);
        return;
      }

      if (!btn.buttonParamsJson || typeof btn.buttonParamsJson !== 'string') {
        errors.push(`interactiveButtons[${i}] buttonParamsJson harus berupa string`);
        return;
      }

      parseButtonParams(btn.name, btn.buttonParamsJson, errors, warnings, i);
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateInteractiveMessageContent(content) {
  const errors = [];
  const warnings = [];

  if (!content || typeof content !== 'object') {
    return { errors: ['content harus berupa objek'], warnings, valid: false };
  }

  const interactive = content.interactiveMessage;
  if (!interactive) {
    return { errors, warnings, valid: true };
  }

  const nativeFlow = interactive.nativeFlowMessage;
  if (!nativeFlow) {
    errors.push('interactiveMessage.nativeFlowMessage tidak ditemukan');
    return { errors, warnings, valid: false };
  }

  if (!Array.isArray(nativeFlow.buttons)) {
    errors.push('nativeFlowMessage.buttons harus berupa array');
    return { errors, warnings, valid: false };
  }

  if (nativeFlow.buttons.length === 0) {
    warnings.push('nativeFlowMessage.buttons kosong');
  }

  nativeFlow.buttons.forEach((btn, i) => {
    if (!btn || typeof btn !== 'object') {
      errors.push(`buttons[${i}] bukan objek`);
      return;
    }

    if (!btn.buttonParamsJson) {
      warnings.push(`buttons[${i}] buttonParamsJson tidak ditemukan (mungkin gagal dirender)`);
    } else if (typeof btn.buttonParamsJson !== 'string') {
      errors.push(`buttons[${i}] buttonParamsJson harus berupa string`);
    } else {
      try { JSON.parse(btn.buttonParamsJson); } catch (e) { warnings.push(`buttons[${i}] buttonParamsJson JSON tidak valid (${e.message})`); }
    }

    if (!btn.name) {
      warnings.push(`buttons[${i}] nama tidak ditemukan; menggunakan default quick_reply`);
      btn.name = 'quick_reply';
    }
  });

  return { errors, warnings, valid: errors.length === 0 };
}

export function getButtonType(message) {
  if (message.listMessage) {
    return 'list';
  } else if (message.buttonsMessage) {
    return 'buttons';
  } else if (message.interactiveMessage?.nativeFlowMessage) {
    return 'native_flow';
  }
  return null;
}

export function getButtonArgs(message) {
  const nativeFlow = message.interactiveMessage?.nativeFlowMessage;
  const firstButtonName = nativeFlow?.buttons?.[0]?.name;

  const nativeFlowSpecials = [
    'mpm', 'cta_catalog', 'send_location',
    'call_permission_request', 'wa_payment_transaction_details',
    'automated_greeting_message_view_catalog'
  ];

  if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
    internalLogger.debug(`[baileys_helpers] getButtonArgs: Terdeteksi tombol Tipe Pembayaran (${firstButtonName})`);
    return {
      tag: 'biz',
      attrs: {
        native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName
      }
    };
  } else if (nativeFlow && nativeFlowSpecials.includes(firstButtonName)) {
    internalLogger.debug(`[baileys_helpers] getButtonArgs: Terdeteksi tombol Tipe Native Flow Spesial (${firstButtonName})`);
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [{
          tag: 'native_flow',
          attrs: {
            v: '2',
            name: firstButtonName
          }
        }]
      }]
    };
  } else if (nativeFlow || message.buttonsMessage) {
    internalLogger.debug(`[baileys_helpers] getButtonArgs: Terdeteksi tombol Tipe Native Flow Mixed (quick_reply, cta_url, dll)`);
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'interactive',
        attrs: {
          type: 'native_flow',
          v: '1'
        },
        content: [{
          tag: 'native_flow',
          attrs: {
            v: '9',
            name: 'mixed'
          }
        }]
      }]
    };
  } else if (message.listMessage) {
    internalLogger.debug(`[baileys_helpers] getButtonArgs: Terdeteksi tombol Tipe List (product_list)`);
    return {
      tag: 'biz',
      attrs: {},
      content: [{
        tag: 'list',
        attrs: {
          v: '2',
          type: 'product_list'
        }
      }]
    };
  } else {
    internalLogger.debug(`[baileys_helpers] getButtonArgs: Tidak ada tombol interaktif terdeteksi, hanya menambahkan tag <biz>`);
    return {
      tag: 'biz',
      attrs: {}
    };
  }
}

function convertToInteractiveMessage(content) {
  if (content.interactiveButtons && content.interactiveButtons.length > 0) {
    internalLogger.debug(`[baileys_helpers] convertToInteractiveMessage: Mengkonversi ${content.interactiveButtons.length} tombol ke nativeFlowMessage`);
    
    const interactiveMessage = {
      nativeFlowMessage: {
        buttons: content.interactiveButtons.map(btn => ({
          name: btn.name || 'quick_reply',
          buttonParamsJson: btn.buttonParamsJson
        }))
      }
    };

    if (content.image) {
      interactiveMessage.header = { imageMessage: content.image };
    } else if (content.video) {
      interactiveMessage.header = { videoMessage: content.video };
    } else if (content.document) {
      interactiveMessage.header = { documentMessage: content.document };
    } else if (content.title || content.subtitle) {
      interactiveMessage.header = {
        title: content.title || content.subtitle || ''
      };
    }

    if (content.text) {
      interactiveMessage.body = { text: content.text };
    }

    if (content.footer) {
      interactiveMessage.footer = { text: content.footer };
    }

    const newContent = { ...content };
    delete newContent.interactiveButtons;
    delete newContent.title;
    delete newContent.subtitle;
    delete newContent.text;
    delete newContent.footer;
    delete newContent.contextInfo;
    delete newContent.image;
    delete newContent.video;
    delete newContent.document;

    return { ...newContent, interactiveMessage };
  }
  
  internalLogger.debug(`[baileys_helpers] convertToInteractiveMessage: Tidak ada tombol interaktif ditemukan, mengembalikan konten asli.`);
  return content;
}

let baileysInternals = {};

async function loadBaileysInternals() {
  if (baileysInternals.generateWAMessageFromContent) return;

  const candidatePkgs = ['baileys', '@whiskeysockets/baileys', '@adiwajshing/baileys'];
  let loaded = false;

  for (const pkg of candidatePkgs) {
    if (loaded) break;
    try {
      const mod = require(pkg);
      baileysInternals.generateWAMessageFromContent = mod.generateWAMessageFromContent || mod.Utils?.generateWAMessageFromContent;
      baileysInternals.normalizeMessageContent = mod.normalizeMessageContent || mod.Utils?.normalizeMessageContent;
      baileysInternals.isJidGroup = mod.isJidGroup || mod.WABinary?.isJidGroup;
      baileysInternals.generateMessageIDV2 = mod.generateMessageIDV2 || mod.Utils?.generateMessageIDV2 || mod.generateMessageID || mod.Utils?.generateMessageID;

      if (baileysInternals.generateWAMessageFromContent && baileysInternals.normalizeMessageContent && baileysInternals.isJidGroup) {
        internalLogger.debug(`[baileys_helpers] loadBaileysInternals: Berhasil memuat internal dari paket '${pkg}'`);
        loaded = true;
      }
    } catch (_) {
        internalLogger.debug(`[baileys_helpers] loadBaileysInternals: Gagal memuat dari '${pkg}', mencoba berikutnya...`);
    }
  }

  if (!loaded) {
    throw new InteractiveValidationError('Internal baileys tidak ditemukan', {
      context: 'hydratedTemplate.dynamicImport',
      errors: ['generateWAMessageFromContent atau normalizeMessageContent tidak ditemukan dalam paket yang terinstal: baileys / @whiskeysockets/baileis / @adiwajshing/baileys'],
      example: { install: 'npm i baileys' }
    });
  }
}

export async function hydratedTemplate(himmel, jid, content, options = {}) {
  if (!himmel) {
    throw new InteractiveValidationError('Socket diperlukan', { context: 'hydratedTemplate' });
  }

  setLogger(himmel.logger || console);
  internalLogger.debug(`[baileys_helpers] hydratedTemplate: Memulai pengiriman ke ${jid}`);

  if (content && Array.isArray(content.interactiveButtons)) {
    const strict = validateSendButtonMsgPayload(content);
    if (!strict.valid) {
      throw new InteractiveValidationError('Payload authoring interaktif tidak valid', {
        context: 'hydratedTemplate.validateSendButtonMsgPayload',
        errors: strict.errors,
        warnings: strict.warnings,
        example: EXAMPLE_PAYLOADS.hydratedTemplate
      });
    }
    internalLogger.debug(`[baileys_helpers] hydratedTemplate: Validasi payload authoring berhasil`);
  }
  
  const { contextInfo } = content;
  const convertedContent = convertToInteractiveMessage(content);

  const { errors: contentErrors, warnings: contentWarnings, valid: contentValid } = validateInteractiveMessageContent(convertedContent);
  if (!contentValid) {
    throw new InteractiveValidationError('Konten interaktif yang dikonversi tidak valid', {
      context: 'hydratedTemplate.validateInteractiveMessageContent',
      errors: contentErrors,
      warnings: contentWarnings,
      example: convertToInteractiveMessage(EXAMPLE_PAYLOADS.hydratedTemplate)
    });
  }

  await loadBaileysInternals();
  const {
    generateWAMessageFromContent,
    normalizeMessageContent,
    isJidGroup,
    generateMessageIDV2
  } = baileysInternals;

  const relayMessage = himmel.relayMessage;
  if (typeof relayMessage !== 'function') {
     throw new InteractiveValidationError('himmel.relayMessage bukan fungsi. Pastikan socket (himmel) diteruskan dengan benar.', {
       context: 'hydratedTemplate.relayCheck'
     });
  }

  const userJid = himmel.authState?.creds?.me?.id || himmel.user?.id;
  
  const finalOptions = {
      logger: himmel.logger,
      userJid,
      messageId: generateMessageIDV2(userJid),
      timestamp: new Date(),
      ...options,
      ...(contextInfo && { contextInfo })
  };

  const fullMsg = generateWAMessageFromContent(jid, convertedContent, finalOptions);

  const normalizedContent = normalizeMessageContent(fullMsg.message);
  const buttonType = getButtonType(normalizedContent);
  let additionalNodes = [...(options.additionalNodes || [])];

  if (buttonType) {
    internalLogger.debug(`[baileys_helpers] hydratedTemplate: Menyiapkan node tambahan untuk tipe tombol: ${buttonType}`);
    const buttonsNode = getButtonArgs(normalizedContent);
    const isPrivate = !isJidGroup(jid);
    additionalNodes.push(buttonsNode);

    if (isPrivate) {
      internalLogger.debug(`[baileys_helpers] hydratedTemplate: Chat pribadi terdeteksi, menambahkan tag <bot biz_bot='1'>`);
      additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
    } else {
      internalLogger.debug(`[baileys_helpers] hydratedTemplate: Chat grup terdeteksi, melewatkan tag <bot>`);
    }
  }

  internalLogger.debug(`[baileys_helpers] hydratedTemplate: Merelay pesan ${fullMsg.key.id} ke ${jid} dengan ${additionalNodes.length} node tambahan`);
  
  await relayMessage(jid, fullMsg.message, {
    messageId: fullMsg.key.id,
    useCachedGroupMetadata: options.useCachedGroupMetadata,
    additionalAttributes: options.additionalAttributes || {},
    statusJidList: options.statusJidList,
    additionalNodes
  });

  const isPrivateChat = !isJidGroup(jid);
  if (himmel.config?.emitOwnEvents && isPrivateChat) {
    internalLogger.debug(`[baileys_helpers] hydratedTemplate: Memicu event sendiri untuk ${fullMsg.key.id}`);
    process.nextTick(() => {
      if (himmel.processingMutex?.mutex && himmel.upsertMessage) {
        himmel.processingMutex.mutex(() => himmel.upsertMessage(fullMsg, 'append'));
      }
    });
  }

  return fullMsg;
}

export async function sendButtons(himmel, jid, data = {}, options = {}) {
  if (!himmel) {
    throw new InteractiveValidationError('Socket diperlukan', { context: 'sendButtons' });
  }

  setLogger(himmel.logger || console);
  internalLogger.debug(`[baileys_helpers] sendButtons: Memulai pengiriman (legacy) ke ${jid}`);

  const { text = '', footer = '', title, subtitle, buttons = [], contextInfo } = data;
  const strict = validateSendButtonsPayload({ text, buttons, title, subtitle, footer });

  if (!strict.valid) {
    throw new InteractiveValidationError('Payload tombol tidak valid', {
      context: 'sendButtons.validateSendButtonsPayload',
      errors: strict.errors,
      warnings: strict.warnings,
      example: EXAMPLE_PAYLOADS.sendButtons
    });
  }

  const { errors, warnings, cleaned } = validateAuthoringButtons(buttons);
  if (errors.length) {
    throw new InteractiveValidationError('Objek tombol authoring tidak valid', {
      context: 'sendButtons.validateAuthoringButtons',
      errors,
      warnings,
      example: EXAMPLE_PAYLOADS.sendButtons.buttons
    });
  }

  const interactiveButtons = buildInteractiveButtons(cleaned);
  const payload = { text, footer, interactiveButtons, contextInfo };

  if (title) payload.title = title;
  if (subtitle) payload.subtitle = subtitle;

  return hydratedTemplate(himmel, jid, payload, options);
}
