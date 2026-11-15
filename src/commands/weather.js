// src/commands/weather.js
// ============================================================
// 🌦️ /clima cidade UF — previsão de hoje e amanhã
// API: Open-Meteo (gratuita, sem chave de acesso)
// Exemplo: /clima curitiba pr
// ============================================================
const { PREFIX } = require("../config");

const GEO_URL      = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS   = 8000;            // tempo máximo por consulta
const CACHE_TTL    = 30 * 60 * 1000;  // 30 min: pedidos repetidos não consultam a API

// ── SIGLA → NOME DO ESTADO ──────────────────────────────────
const UFS = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins"
};

// ── CÓDIGO DO TEMPO (WMO) → ÍCONE + TEXTO ───────────────────
const WMO = {
  0 : ["☀️", "Céu limpo"],
  1 : ["🌤️", "Predomínio de sol"],
  2 : ["⛅", "Parcialmente nublado"],
  3 : ["☁️", "Nublado"],
  45: ["🌫️", "Neblina"],
  48: ["🌫️", "Neblina com geada"],
  51: ["🌦️", "Garoa fraca"],
  53: ["🌦️", "Garoa moderada"],
  55: ["🌦️", "Garoa forte"],
  56: ["🌧️", "Garoa congelante"],
  57: ["🌧️", "Garoa congelante forte"],
  61: ["🌧️", "Chuva fraca"],
  63: ["🌧️", "Chuva moderada"],
  65: ["🌧️", "Chuva forte"],
  66: ["🌧️", "Chuva congelante"],
  67: ["🌧️", "Chuva congelante forte"],
  71: ["❄️", "Neve fraca"],
  73: ["❄️", "Neve moderada"],
  75: ["❄️", "Neve forte"],
  77: ["❄️", "Grãos de neve"],
  80: ["🌦️", "Pancadas de chuva fracas"],
  81: ["🌧️", "Pancadas de chuva moderadas"],
  82: ["⛈️", "Pancadas de chuva fortes"],
  85: ["❄️", "Pancadas de neve"],
  86: ["❄️", "Pancadas de neve fortes"],
  95: ["⛈️", "Tempestade"],
  96: ["⛈️", "Tempestade com granizo"],
  99: ["⛈️", "Tempestade com granizo forte"]
};
const wmo = (code) => WMO[code] || ["🌡️", "Condição indisponível"];

// ── UTILIDADES ──────────────────────────────────────────────
// Tira acentos e deixa minúsculo (para comparar nomes)
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function fetchJson(url) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// "2026-11-07" → "sáb, 07/11"
function dayLabel(iso) {
  const dt = new Date(`${iso}T12:00:00`);
  const wd = dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const dm = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${wd}, ${dm}`;
}

const fmtMm = (v) => { const n = Number(v) || 0; return n >= 1 ? Math.round(n) : n.toFixed(1); };

// ── BUSCA DA CIDADE (nome + UF) ─────────────────────────────
const geoCache = new Map();

async function findCity(city, uf) {
  const key = `${norm(city)}|${uf}`;
  if (geoCache.has(key)) return geoCache.get(key);

  const state = norm(UFS[uf]);
  const tries = [city];
  if (norm(city) !== city.toLowerCase()) tries.push(norm(city)); // tenta de novo sem acento

  let place = null;
  for (const name of tries) {
    const url  = `${GEO_URL}?name=${encodeURIComponent(name)}&count=20&language=pt&countryCode=BR`;
    const data = await fetchJson(url);
    const inState = (data.results || []).filter((r) => norm(r.admin1) === state);
    // Prefere o nome exato; senão, o primeiro resultado do estado
    place = inState.find((r) => norm(r.name) === norm(city)) || inState[0] || null;
    if (place) break;
  }

  if (place) geoCache.set(key, place);
  return place;
}

// ── MONTA A MENSAGEM ────────────────────────────────────────
function buildMessage(place, uf, data) {
  const cur = data.current || {};
  const d   = data.daily;
  const [headIcon] = wmo(d.weather_code[0]);

  const dayBlock = (i, title) => {
    const [icon, text] = wmo(d.weather_code[i]);
    return (
      `📆 *${title} (${dayLabel(d.time[i])})*\n` +
      `🌡️ Mín ${Math.round(d.temperature_2m_min[i])}°C · Máx ${Math.round(d.temperature_2m_max[i])}°C\n` +
      `☔ Chuva: ${d.precipitation_probability_max[i] ?? 0}% (≈ ${fmtMm(d.precipitation_sum[i])} mm)\n` +
      `${icon} ${text}`
    );
  };

  let msg = `${headIcon} *Clima — ${place.name}, ${uf}*\n\n`;

  if (cur.temperature_2m !== undefined) {
    const [, curText] = wmo(cur.weather_code);
    msg +=
      `📍 *Agora:* ${Math.round(cur.temperature_2m)}°C · ${curText}\n` +
      `💧 Umidade ${Math.round(cur.relative_humidity_2m)}% · 💨 Vento ${Math.round(cur.wind_speed_10m)} km/h\n\n`;
  }

  msg +=
    `━━━━━━━━━━━━━━\n` +
    `${dayBlock(0, "Hoje")}\n\n` +
    `${dayBlock(1, "Amanhã")}\n` +
    `━━━━━━━━━━━━━━\n\n` +
    `> By: Bunny Ghost`;

  return msg;
}

// ── HANDLER PRINCIPAL ───────────────────────────────────────
const forecastCache = new Map(); // "cidade|UF" → { ts, text }

async function handleWeather(sock, message, from, content) {
  const reply = (text) => sock.sendMessage(from, { text }, { quoted: message });

  // /clima curitiba pr → cidade = "curitiba", UF = "PR"
  const parts = content.trim().split(/\s+/).slice(1);
  const uf    = (parts[parts.length - 1] || "").toUpperCase();
  const city  = parts.slice(0, -1).join(" ");

  if (parts.length < 2 || !UFS[uf]) {
    return reply(`⚠️ Use: *${PREFIX}clima cidade UF*\nExemplo: *${PREFIX}clima curitiba pr*`);
  }

  const key    = `${norm(city)}|${uf}`;
  const cached = forecastCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return reply(cached.text);

  try {
    const place = await findCity(city, uf);
    if (!place) {
      return reply(`❌ Não encontrei *${city}* em *${uf}*.\nConfira o nome da cidade e a sigla do estado.`);
    }

    const url =
      `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum` +
      `&timezone=auto&forecast_days=2`;

    const data = await fetchJson(url);
    const text = buildMessage(place, uf, data);

    forecastCache.set(key, { ts: Date.now(), text });
    return reply(text);
  } catch (err) {
    console.error("[clima]", err.message);
    return reply("❌ Não consegui consultar o clima agora. Tente novamente em instantes.");
  }
}

module.exports = handleWeather;
module.exports._buildMessage = buildMessage; // usado só em testes
