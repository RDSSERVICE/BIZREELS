const axios = require('axios');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Deal = require('../models/Deal');
const { ChatThread, ChatMessage } = require('../models/Chat');
const settingsService = require('./settings.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_DAILY_CAP = 100000;

const DEFAULT_FEATURE_MODELS = {
  title: 'gemini-2.5-flash',
  category: 'gemini-2.5-flash',
  price: 'gemini-2.5-pro',
  match: 'gemini-2.5-flash',
  demand: 'gemini-2.5-pro',
  negotiate: 'gemini-2.5-pro',
};

const getCfg = () => {
  const snap = settingsService.getIntegrationSync('ai_content');
  const provider = (snap.provider || process.env.AI_PROVIDER || DEFAULT_PROVIDER).trim();
  const model = (snap.model || process.env.AI_MODEL || DEFAULT_MODEL).trim();
  const apiKey = (snap.api_key || '').trim() || (process.env.GOOGLE_AI_API_KEY || '').trim();
  const enabled = snap.enabled !== undefined ? !!snap.enabled : process.env.AI_DEV_MODE !== 'true';

  return { provider, model, apiKey, enabled };
};

const isConfigured = () => {
  return !!getCfg().apiKey;
};

const getTodayKey = () => {
  return new Date().toISOString().slice(0, 10);
};

const getDailyCap = async () => {
  const snap = settingsService.getIntegrationSync('ai_content');
  try {
    const cap = parseInt(snap.daily_tokens_cap || DEFAULT_DAILY_CAP, 10);
    return Math.max(1000, cap);
  } catch {
    return DEFAULT_DAILY_CAP;
  }
};

const getUsageToday = async () => {
  const day = getTodayKey();
  const conn = mongoose.connection;
  const doc = await conn.db.collection('ai_usage').findOne({ _id: day });
  const used = doc ? parseInt(doc.tokens_used || 0, 10) : 0;
  const cap = await getDailyCap();
  return {
    day,
    tokens_used: used,
    tokens_cap: cap,
    tokens_remaining: Math.max(0, cap - used),
  };
};

const ensureBudgetOrRaise = async (estimateTokens = 1200) => {
  const u = await getUsageToday();
  if (u.tokens_used + estimateTokens > u.tokens_cap) {
    throw new ApiError(
      429,
      `Global AI budget for today reached (${u.tokens_used}/${u.tokens_cap} tokens). Try again after UTC midnight.`
    );
  }
};

const recordTokens = async (tokens) => {
  if (tokens <= 0) return;
  const day = getTodayKey();
  const conn = mongoose.connection;
  await conn.db.collection('ai_usage').updateOne(
    { _id: day },
    {
      $inc: { tokens_used: parseInt(tokens, 10) },
      $setOnInsert: { created_at: new Date().toISOString() },
    },
    { upsert: true }
  );
};

const resolveModel = (feature) => {
  const cfg = getCfg();
  const provider = cfg.provider;
  const snap = settingsService.getIntegrationSync('ai_content') || {};
  const featureModels = snap.feature_models || {};
  const model = (featureModels[feature] || '').trim() || DEFAULT_FEATURE_MODELS[feature] || cfg.model || 'gemini-2.5-flash';
  return { provider, model };
};

const callGeminiAPI = async (systemInstruction, prompt, featureName) => {
  const cfg = getCfg();
  if (!cfg.apiKey) {
    throw new Error('AI not configured: GOOGLE_AI_API_KEY / api_key missing');
  }
  if (!cfg.enabled) {
    throw new Error('AI is disabled by admin (enabled=false)');
  }

  const { model } = resolveModel(featureName);
  // standard gemini endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await axios.post(url, payload, { timeout: 12000 });
  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini API');
  }
  return rawText;
};

const parseJsonStrict = (raw) => {
  if (!raw) throw new Error('empty response');
  let clean = raw.trim();
  // Strip code fences if present
  const m = clean.match(/```(?:json)?\s*(\{.*?\})\s*```/s);
  if (m) {
    clean = m[1];
  } else {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      clean = clean.slice(start, end + 1);
    }
  }
  return JSON.parse(clean);
};

const SYSTEM_LISTING =
  'You are an expert Indian marketplace listing writer. Generate SEO-friendly, ' +
  'engaging, culturally-aware content for products/services sold in India. ' +
  'Users are Indian buyers — use ₹ pricing, Indian cultural references (festivals, ' +
  'regional products, cities), and speak with a friendly-professional tone. ' +
  'Output MUST be valid JSON that matches the schema in the user message — no ' +
  'commentary, no markdown fences. If a field doesn\'t apply to the listing type, ' +
  'return an empty array/null. Never invent brand names or false claims.';

const SYSTEM_IMPROVE =
  'You are an editor rewriting a marketplace listing description for Indian buyers. ' +
  'Keep facts identical, improve clarity, add emotional hooks and a soft CTA, ' +
  'match the requested tone. Output MUST be a single JSON object: ' +
  '{"description": "..."}. No markdown fences.';

const getListingSchemaPrompt = () => {
  return (
    'Return JSON in this exact schema:\n' +
    '{\n' +
    '  "description": "150-300 word engaging description, 3-5 features, use case, CTA",\n' +
    '  "short_description": "≤15 word tagline",\n' +
    '  "tags": ["5-10 kebab-case tags"],\n' +
    '  "features": ["3-6 bullet-point features"],\n' +
    '  "variants": [ /* products → {name,type:"size|color|material|custom",options:[]};\n' +
    '                 services → {name,price_hint_inr,features:[]} tiers */ ],\n' +
    '  "suggested_price_range_inr": {"min": int, "max": int},\n' +
    '  "warranty_suggestion": "string, only for new_product; empty otherwise"\n' +
    '}'
  );
};

const getEmptyListingStruct = (listingType) => ({
  description: '',
  short_description: '',
  tags: [],
  features: [],
  variants: [],
  suggested_price_range_inr: null,
  warranty_suggestion: '',
});

const cleanVariants = (vs, listingType) => {
  if (!Array.isArray(vs)) return [];
  const cleaned = [];
  const allowedTypes = new Set(['size', 'color', 'material', 'tier', 'custom']);

  for (const v of vs.slice(0, 6)) {
    if (!v || typeof v !== 'object') continue;
    const name = String(v.name || '').trim().slice(0, 32);
    if (!name) continue;

    if (listingType === 'service') {
      cleaned.push({
        name,
        price_hint_inr: parseInt(v.price_hint_inr || 0, 10) || null,
        features: (v.features || []).map(x => String(x || '').trim()).slice(0, 5),
      });
    } else {
      let vtype = String(v.type || 'custom').toLowerCase().trim();
      if (!allowedTypes.has(vtype)) {
        vtype = 'custom';
      }
      const opts = (v.options || []).map(o => String(o || '').trim()).filter(Boolean).slice(0, 12);
      if (opts.length === 0) continue;
      cleaned.push({ name, type: vtype, options: opts });
    }
  }
  return cleaned;
};

const normalizeListingData = (d, listingType) => {
  const out = {
    description: String(d.description || '').trim(),
    short_description: String(d.short_description || '').trim(),
    tags: (d.tags || []).map(x => String(x || '').trim().toLowerCase().replace(/\s+/g, '-')).slice(0, 10),
    features: (d.features || []).map(x => String(x || '').trim()).slice(0, 8),
    variants: cleanVariants(d.variants || [], listingType),
    suggested_price_range_inr: d.suggested_price_range_inr || null,
    warranty_suggestion: listingType === 'new_product' ? String(d.warranty_suggestion || '').trim() : '',
  };
  const price = out.suggested_price_range_inr;
  if (price && typeof price === 'object') {
    try {
      out.suggested_price_range_inr = {
        min: parseInt(price.min || 0, 10),
        max: parseInt(price.max || 0, 10),
      };
    } catch {
      out.suggested_price_range_inr = null;
    }
  }
  return out;
};

const generateListingContent = async (title, categoryName, subCategoryName, listingType, hints = null, media = null) => {
  await ensureBudgetOrRaise(1800);
  const started = Date.now();
  const { model, provider } = resolveModel('listing');

  let prompt = `Generate a marketplace listing.\n- Title: ${title}\n- Type: ${listingType}\n- Category: ${categoryName || 'general'}`;
  if (subCategoryName) prompt += ` > ${subCategoryName}`;
  prompt += '\n';
  if (hints) prompt += `- Extra context: ${hints}\n`;

  if (media) {
    if (media.video_url) prompt += `- Vendor demo video: ${media.video_url}\n`;
    if (media.audio_url) prompt += `- Vendor voice description: ${media.audio_url}\n`;
    if (media.image_urls && media.image_urls.length > 0) {
      prompt += `- Product images: ${media.image_urls.slice(0, 6).join(', ')}\n`;
    }
  }
  prompt += `\n${getListingSchemaPrompt()}`;

  try {
    const raw = await callGeminiAPI(SYSTEM_LISTING, prompt, 'listing');
    const data = parseJsonStrict(raw);
    const approxTokens = Math.max(400, Math.min(3000, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approxTokens);

    return {
      ok: true,
      generated: normalizeListingData(data, listingType),
      meta: {
        latency_ms: Date.now() - started,
        model_used: model,
        provider,
        tokens_used: approxTokens,
        media_used: !!(media && (media.video_url || media.audio_url || (media.image_urls && media.image_urls.length > 0))),
      },
    };
  } catch (err) {
    logger.warn(`AI listing generation failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      generated: getEmptyListingStruct(listingType),
      meta: {
        latency_ms: Date.now() - started,
        model_used: model,
        provider,
      },
    };
  }
};

const transcribeAudio = async (audioUrl) => {
  await ensureBudgetOrRaise(600);
  const started = Date.now();
  const { model, provider } = resolveModel('transcribe');

  const prompt =
    `Transcribe the audio at the URL below into a clean, punctuated English transcript. ` +
    `Preserve product / brand names verbatim.\n\nAudio: ${audioUrl}\n\n` +
    `Return JSON: {"transcript": "…", "language": "en|hi|mixed", "confidence": "low|medium|high"}`;

  try {
    const raw = await callGeminiAPI('You are a professional audio transcriber. Output JSON only.', prompt, 'transcribe');
    const data = parseJsonStrict(raw);
    const approx = Math.max(200, Math.min(2000, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      transcript: String(data.transcript || '').slice(0, 2000),
      language: String(data.language || 'en'),
      confidence: String(data.confidence || 'medium'),
      meta: {
        provider,
        model_used: model,
        tokens_used: approx,
        latency_ms: Date.now() - started,
      },
    };
  } catch (err) {
    logger.warn(`AI transcribe failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      transcript: '',
      meta: {
        provider,
        model_used: model,
        latency_ms: Date.now() - started,
      },
    };
  }
};

const improveDescription = async (currentDescription, title, tone) => {
  await ensureBudgetOrRaise(800);
  const started = Date.now();
  const { model, provider } = resolveModel('improve');

  const cleanTone = ['professional', 'friendly', 'hindi_mix'].includes(tone) ? tone : 'friendly';
  const prompt =
    `Rewrite this listing description in a "${cleanTone}" tone. Keep every fact ` +
    `unchanged, improve clarity and add a soft CTA at the end.\n\n` +
    `Listing title: {title}\n` +
    `Current description:\n"""\n${currentDescription}\n"""\n\n` +
    `Return: {"description": "..."}`;

  try {
    const raw = await callGeminiAPI(SYSTEM_IMPROVE, prompt, 'improve');
    const data = parseJsonStrict(raw);
    const approxTokens = Math.max(200, Math.min(1500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approxTokens);

    return {
      ok: true,
      description: String(data.description || '').trim(),
      meta: {
        latency_ms: Date.now() - started,
        model_used: model,
        provider,
        tokens_used: approxTokens,
      },
    };
  } catch (err) {
    logger.warn(`AI improve failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      description: currentDescription,
      meta: {
        latency_ms: Date.now() - started,
        model_used: model,
        provider,
      },
    };
  }
};

const ping = async () => {
  const started = Date.now();
  const { model, provider } = resolveModel('ping');
  try {
    const raw = await callGeminiAPI('Reply with exactly the word \'pong\' — no punctuation.', 'ping', 'ping');
    return {
      ok: true,
      reply: String(raw || '').trim().slice(0, 40),
      latency_ms: Date.now() - started,
      provider,
      model,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message.slice(0, 400),
      latency_ms: Date.now() - started,
      provider,
      model,
    };
  }
};

// ============================================================ SMART FEATURES
const SYS_TITLE =
  'You are a marketplace listing specialist for India. Write concise, ' +
  'SEO-friendly, buyer-appealing product/service titles for Indian buyers. ' +
  'Titles ≤ 70 characters, no ALL CAPS, no emoji, no seller phone/city, ' +
  'specific (brand + key spec if available). Output MUST be valid JSON.';

const generateTitles = async (description, categoryHint, listingType, imageUrls = null) => {
  await ensureBudgetOrRaise(600);
  const started = Date.now();
  const { model, provider } = resolveModel('title');

  let prompt = `Generate 3 title candidates for a ${listingType} listing.\n`;
  if (categoryHint) prompt += `Category hint: ${categoryHint}\n`;
  if (description) prompt += `Description: ${description}\n`;
  if (imageUrls && imageUrls.length > 0) prompt += `Number of listing images provided: ${imageUrls.length}\n`;
  prompt += '\nReturn JSON: {"titles": ["title1", "title2", "title3"], "recommended_index": 0}';

  try {
    const raw = await callGeminiAPI(SYS_TITLE, prompt, 'title');
    const data = parseJsonStrict(raw);
    const titles = (data.titles || []).map(t => String(t || '').trim().slice(0, 70)).filter(Boolean).slice(0, 3);
    if (titles.length === 0) throw new Error('no titles returned');

    let idx = parseInt(data.recommended_index || 0, 10);
    idx = Math.max(0, Math.min(titles.length - 1, idx));

    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      titles,
      recommended_index: idx,
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI generate_titles failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      titles: [],
      recommended_index: 0,
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const loadCategoryTree = async () => {
  const cats = await Category.find({ is_deleted: { $ne: true }, parent_id: null }, { name: 1 });
  const out = [];
  for (const c of cats) {
    const subs = await Category.find({ parent_id: c._id.toString(), is_deleted: { $ne: true } }, { name: 1 });
    out.push({
      id: c._id.toString(),
      name: c.name,
      sub: subs.map(s => ({ id: s._id.toString(), name: s.name })),
    });
  }
  return out;
};

const detectCategory = async (title, description, imageUrls = null) => {
  await ensureBudgetOrRaise(700);
  const started = Date.now();
  const { model, provider } = resolveModel('category');

  const tree = await loadCategoryTree();
  if (tree.length === 0) {
    return { ok: false, error: 'No categories configured', meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started } };
  }

  const idToInfo = {};
  const treePromptLines = [];
  for (const c of tree) {
    treePromptLines.push(`- id=${c.id} | ${c.name}`);
    idToInfo[c.id] = { name: c.name, parent_id: null, kind: 'top' };
    for (const s of c.sub) {
      treePromptLines.push(`    - sub_id=${s.id} | ${s.name} (parent: ${c.name})`);
      idToInfo[s.id] = { name: s.name, parent_id: c.id, kind: 'sub' };
    }
  }

  const prompt =
    `Category tree:\n` +
    treePromptLines.join('\n') +
    `\n\nListing to classify:\n` +
    (title ? `- Title: ${title}\n` : '') +
    (description ? `- Description: ${description}\n` : '') +
    (imageUrls && imageUrls.length > 0 ? `- Has ${imageUrls.length} images\n` : '') +
    `\nReturn JSON: {"category_id":"<top_id>", "sub_category_id":"<sub_id_or_empty>", "confidence": 0.0-1.0, "reason":"short one-liner"}`;

  try {
    const raw = await callGeminiAPI(
      'You classify Indian marketplace listings into the platform\'s fixed category tree. Pick the SINGLE best (category, sub_category) pair. Output MUST be valid JSON.',
      prompt,
      'category'
    );
    const data = parseJsonStrict(raw);

    const catId = String(data.category_id || '').trim();
    let subId = String(data.sub_category_id || '').trim() || null;

    if (!idToInfo[catId] || idToInfo[catId].kind !== 'top') {
      return { ok: false, error: 'Model returned an invalid category id', meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started } };
    }
    if (subId) {
      const info = idToInfo[subId];
      if (!info || info.kind !== 'sub' || info.parent_id !== catId) {
        subId = null;
      }
    }

    const confidence = Math.max(0.0, Math.min(1.0, parseFloat(data.confidence || 0.0)));
    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      category_id: catId,
      sub_category_id: subId,
      category_name: idToInfo[catId].name,
      sub_category_name: subId ? idToInfo[subId].name : null,
      confidence,
      reason: String(data.reason || '').slice(0, 200),
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI detect_category failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const parseDemand = async (text) => {
  await ensureBudgetOrRaise(900);
  const started = Date.now();
  const { model, provider } = resolveModel('demand');

  const tree = await loadCategoryTree();
  const treeLines = [];
  const allIds = new Set();
  for (const c of tree) {
    treeLines.push(`- ${c.name} (id=${c.id})`);
    allIds.add(c.id);
    for (const s of c.sub) {
      treeLines.push(`    - ${s.name} (sub_id=${s.id})`);
      allIds.add(s.id);
    }
  }

  const prompt =
    `Buyer message: """${text}"""\n\n` +
    `Available categories:\n` +
    treeLines.join('\n') +
    `\n\nReturn JSON: {"understood_intent": "1-line rewrite in clear English", "extracted": {"product_or_service": "...", "category_id": "id or null", "sub_category_id": "id or null", "price_range_inr": {"min": int|null, "max": int|null}, "city": "string or null", "urgency": "immediate|this_week|this_month|flexible", "quantity": int, "must_have_features": [], "nice_to_have_features": []}, "clarifying_questions": ["short q1", "short q2"]}`;

  try {
    const raw = await callGeminiAPI(
      'You parse casual Indian buyer intent messages into strict structured JSON. Propose 1-3 short clarifying questions.',
      prompt,
      'demand'
    );
    const data = parseJsonStrict(raw);

    const ext = data.extracted || {};
    if (ext.category_id && !allIds.has(ext.category_id)) ext.category_id = null;
    if (ext.sub_category_id && !allIds.has(ext.sub_category_id)) ext.sub_category_id = null;

    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      understood_intent: String(data.understood_intent || '').slice(0, 280),
      extracted: ext,
      clarifying_questions: (data.clarifying_questions || []).map(q => String(q || '').trim()).filter(Boolean).slice(0, 3),
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI parse_demand failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      understood_intent: text.slice(0, 280),
      extracted: {},
      clarifying_questions: [],
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const matchVendors = async (categoryId, subCategoryId, city, priceMax, mustHaveFeatures, description, limit = 10) => {
  await ensureBudgetOrRaise(1200);
  const started = Date.now();
  const { model, provider } = resolveModel('match');

  const q = { status: 'active', is_deleted: { $ne: true } };
  if (categoryId) q.category_id = categoryId;
  if (subCategoryId) q.sub_category_id = subCategoryId;
  if (city) {
    const escaped = city.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    q.$or = [{ 'location.city': { $regex: `^${escaped}$`, $options: 'i' } }, { 'location.city': { $exists: false } }];
  }
  if (priceMax) {
    q.price = { $lte: parseInt(priceMax, 10) * 2 }; // allow headroom
  }

  const docs = await Listing.find(q, { title: 1, description: 1, vendor_id: 1, price: 1, offer_price: 1, location: 1 }).limit(40);
  if (docs.length === 0) {
    return { ok: true, matches: [], candidate_count: 0, meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started } };
  }

  const vendorIds = Array.from(new Set(docs.map(d => d.vendor_id).filter(Boolean)));
  const vendors = await User.find({ _id: { $in: vendorIds }, is_deleted: { $ne: true } });
  const vendorMap = {};
  for (const v of vendors) {
    vendorMap[v._id.toString()] = v;
  }

  const candidates = [];
  for (const d of docs) {
    const v = vendorMap[d.vendor_id];
    if (!v) continue;
    candidates.push({
      vendor_id: v._id.toString(),
      vendor_name: v.name || 'Vendor',
      listing_id: d._id.toString(),
      listing_title: (d.title || '').slice(0, 80),
      listing_desc: (d.description || '').slice(0, 200),
      price_inr: d.offer_price || d.price || 0,
      city: (d.location || {}).city || v.city,
      verified: v.is_subscribed_verified && v.kyc_status === 'approved',
      trust: parseInt(v.trust_score || 0, 10),
      rating: parseFloat(v.rating_avg || 0.0),
    });
  }

  if (candidates.length === 0) {
    return { ok: true, matches: [], candidate_count: 0, meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started } };
  }

  const prompt =
    `Buyer requirement: """${description.slice(0, 400)}"""\n` +
    (city ? `Buyer city: ${city}\n` : '') +
    (priceMax ? `Buyer max price INR: ${priceMax}\n` : '') +
    (mustHaveFeatures ? `Must-have features: ${mustHaveFeatures.join(', ')}\n` : '') +
    `\nCandidates (${candidates.length}):\n` +
    JSON.stringify(candidates) +
    `\n\nReturn JSON: {"matches": [{"vendor_id": "string", "listing_id": "string", "score": 0-100, "reasons": ["reason1", ...]}] } top ${limit} score desc. Score >= 30 only.`;

  try {
    const raw = await callGeminiAPI(
      'You score how well each candidate vendor matches a buyer requirement, 0-100. Prefer verified + trusted + relevant. Output MUST be valid JSON.',
      prompt,
      'match'
    );
    const data = parseJsonStrict(raw);

    const idToCand = {};
    for (const c of candidates) idToCand[c.listing_id] = c;

    const rawMatches = data.matches || [];
    const out = [];
    for (const m of rawMatches.slice(0, limit)) {
      const lid = String(m.listing_id || '');
      const cand = idToCand[lid];
      if (!cand) continue;
      const score = Math.max(0, Math.min(100, parseInt(m.score || 0, 10)));
      out.push({
        vendor_id: cand.vendor_id,
        vendor_name: cand.vendor_name,
        top_listing_id: lid,
        top_listing_title: cand.listing_title,
        score,
        reasons: (m.reasons || []).map(r => String(r || '').slice(0, 120)).slice(0, 4),
      });
    }

    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      matches: out,
      candidate_count: candidates.length,
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI match_vendors failed: ${err.message}`);
    candidates.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || b.trust - a.trust);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      matches: candidates.slice(0, limit).map(c => ({
        vendor_id: c.vendor_id,
        vendor_name: c.vendor_name,
        top_listing_id: c.listing_id,
        score: 50,
        reasons: ['Fallback: sorted by trust score'],
      })),
      candidate_count: candidates.length,
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const suggestPrice = async (title, description, categoryId, subCategoryId, condition, city, listingType) => {
  await ensureBudgetOrRaise(800);
  const started = Date.now();
  const { model, provider } = resolveModel('price');

  const q = { status: { $in: ['active', 'sold'] }, is_deleted: { $ne: true } };
  if (categoryId) q.category_id = categoryId;
  if (subCategoryId) q.sub_category_id = subCategoryId;
  if (condition) q.condition = condition;

  const similar = await Listing.find(q, { price: 1, offer_price: 1, title: 1 }).sort({ created_at: -1 }).limit(30);
  const prices = similar.map(s => parseInt(s.offer_price || s.price || 0, 10)).filter(p => p > 0);

  const stats = { count: prices.length };
  if (prices.length > 0) {
    prices.sort((a, b) => a - b);
    stats.min = prices[0];
    stats.max = prices[prices.length - 1];
    stats.median = prices[Math.floor(prices.length / 2)];
    stats.avg = Math.floor(prices.reduce((sum, p) => sum + p, 0) / prices.length);
  }

  const prompt =
    `Item to price:\n- Title: ${title}\n- Description: ${description.slice(0, 400)}\n` +
    `- Type: ${listingType}\n- Condition: ${condition || 'n/a'}\n` +
    `- City: ${city || 'India'}\n\n` +
    `Comparable listings stats: ${JSON.stringify(stats)}\n\n` +
    `Return JSON: {"suggested_price_inr": int, "suggested_offer_price_inr": int, "min_inr": int, "max_inr": int, "confidence": "low|medium|high", "reasoning": "1-2 sentence explanation"}`;

  try {
    const raw = await callGeminiAPI(
      'You are a pricing analyst for the Indian marketplace. Suggest fair prices. Output MUST be valid JSON.',
      prompt,
      'price'
    );
    const data = parseJsonStrict(raw);

    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      suggested_price_inr: parseInt(data.suggested_price_inr || 0, 10),
      suggested_offer_price_inr: parseInt(data.suggested_offer_price_inr || 0, 10),
      min_inr: parseInt(data.min_inr || 0, 10),
      max_inr: parseInt(data.max_inr || 0, 10),
      similar_listings_count: stats.count,
      confidence: String(data.confidence || 'medium').toLowerCase(),
      reasoning: String(data.reasoning || '').slice(0, 300),
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI suggest_price failed: ${err.message}`);
    if (prices.length > 0) {
      const med = stats.median;
      return {
        ok: false,
        error: err.message.slice(0, 400),
        suggested_price_inr: med,
        suggested_offer_price_inr: Math.floor(med * 0.92),
        min_inr: stats.min,
        max_inr: stats.max,
        similar_listings_count: stats.count,
        confidence: 'low',
        reasoning: 'Fallback: median of similar listings.',
        meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
      };
    }
    return {
      ok: false,
      error: err.message.slice(0, 400),
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const negotiationHelper = async (dealId, threadId, direction, ask, userId) => {
  await ensureBudgetOrRaise(1000);
  const started = Date.now();
  const { model, provider } = resolveModel('negotiate');

  const cleanDirection = ['buyer', 'seller'].includes(direction) ? direction : 'buyer';
  const cleanAsk = ['suggest_counter', 'write_message', 'analyze_situation'].includes(ask) ? ask : 'write_message';

  const ctx = {};
  let finalThreadId = threadId;

  if (dealId) {
    const deal = await Deal.findOne({ _id: dealId, is_deleted: { $ne: true } });
    if (deal) {
      const buyerId = deal.buyer_id.toString();
      const sellerId = (deal.seller_id || deal.vendor_id || '').toString();
      if (userId !== buyerId && userId !== sellerId) {
        throw ApiError.forbidden('You are not part of this deal');
      }
      ctx.deal = {
        status: deal.status,
        asking_price: deal.asking_price,
        current_offer: deal.current_offer,
        offers_history: (deal.offers_history || []).slice(-6),
      };
      if (deal.listing_id) {
        const lst = await Listing.findById(deal.listing_id, { title: 1, price: 1, offer_price: 1, condition: 1, description: 1 });
        if (lst) {
          ctx.listing = {
            title: lst.title,
            price_inr: lst.price,
            offer_price_inr: lst.offer_price,
            condition: lst.condition,
            description: (lst.description || '').slice(0, 300),
          };
        }
      }
      if (!finalThreadId) {
        finalThreadId = deal.thread_id ? deal.thread_id.toString() : null;
      }
    }
  }

  if (finalThreadId) {
    const thread = await ChatThread.findOne({ _id: finalThreadId, is_deleted: { $ne: true } });
    if (thread) {
      const pStr = (thread.participants || []).map(p => p.toString());
      if (!pStr.includes(userId)) {
        throw ApiError.forbidden('You are not part of this thread');
      }
      const msgs = await ChatMessage.find({ thread_id: finalThreadId, is_deleted: { $ne: true } }, { sender_id: 1, text: 1, created_at: 1 }).sort({ created_at: -1 }).limit(20);
      msgs.reverse();
      ctx.recent_messages = msgs.map(m => ({
        from: m.sender_id.toString() === userId ? 'self' : 'other',
        text: (m.text || '').slice(0, 300),
      }));
    }
  }

  if (Object.keys(ctx).length === 0) {
    throw ApiError.badRequest('No deal or thread context found');
  }

  // Auto load deal if not present
  if (finalThreadId && !ctx.deal) {
    const dealByThread = await Deal.findOne({ thread_id: finalThreadId, is_deleted: { $ne: true } });
    if (dealByThread) {
      ctx.deal = {
        status: dealByThread.status,
        asking_price: dealByThread.asking_price,
        current_offer: dealByThread.current_offer,
        offers_history: (dealByThread.offers_history || []).slice(-6),
      };
      if (dealByThread.listing_id && !ctx.listing) {
        const lst = await Listing.findById(dealByThread.listing_id, { title: 1, price: 1, offer_price: 1, condition: 1, description: 1 });
        if (lst) {
          ctx.listing = {
            title: lst.title,
            price_inr: lst.price,
            offer_price_inr: lst.offer_price,
            condition: lst.condition,
            description: (lst.description || '').slice(0, 300),
          };
        }
      }
    }
  }

  const taskPrompts = {
    suggest_counter: 'Return JSON: {"suggested_offer_inr": int, "suggested_message": "≤ 40 word counter message", "tone": "friendly_professional", "reasoning": "short note"}',
    write_message: 'Return JSON: {"suggested_message": "≤ 40 word chat reply", "tone": "friendly_professional", "reasoning": "short note"}',
    analyze_situation: 'Return JSON: {"analysis": "3-4 sentence read", "next_best_move": "concrete recommended action", "likely_acceptance_price_inr": int, "confidence": "low|medium|high"}',
  };

  const prompt =
    `You are advising the ${cleanDirection.toUpperCase()}.\n` +
    `Task: ${cleanAsk}\n\n` +
    `Context: ${JSON.stringify(ctx)}\n\n` +
    taskPrompts[cleanAsk];

  try {
    const raw = await callGeminiAPI(
      'You help reach fair negotiation deals. Output MUST be valid JSON.',
      prompt,
      'negotiate'
    );
    const data = parseJsonStrict(raw);
    const approx = Math.max(200, Math.min(3500, Math.floor((prompt.length + raw.length) / 4)));
    await recordTokens(approx);

    return {
      ok: true,
      ask: cleanAsk,
      direction: cleanDirection,
      result: data,
      meta: { provider, model_used: model, tokens_used: approx, latency_ms: Date.now() - started },
    };
  } catch (err) {
    logger.warn(`AI negotiation_helper failed: ${err.message}`);
    return {
      ok: false,
      error: err.message.slice(0, 400),
      ask: cleanAsk,
      direction: cleanDirection,
      meta: { provider, model_used: model, tokens_used: 0, latency_ms: Date.now() - started },
    };
  }
};

const detectForbiddenContactDetails = (text) => {
  if (!text || typeof text !== 'string') return { hasViolation: false };
  const str = text.trim();

  // Phone number / WhatsApp regex (10 digit numbers, +91, spaced numbers)
  const phoneRegex = /(?:(?:\+|00)91[\s-]*)?[6789]\d{9}|\b\d{10}\b|\b\d{5}[\s-]\d{5}\b/;
  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  // Website URL regex
  const websiteRegex = /(https?:\/\/|www\.)[^\s]+/i;
  // Social handle regex (@username)
  const socialHandleRegex = /@[\w_.]{3,}/;
  // QR Code / WhatsApp text keywords
  const qrKeywords = /qr\s*code|scan\s*qr|scan\s*to\s*pay|whatsapp\s*me|call\s*me\s*at|contact\s*me\s*at/i;

  if (phoneRegex.test(str)) {
    return { hasViolation: true, detectedType: 'Phone / WhatsApp Number', snippet: str.match(phoneRegex)[0] };
  }
  if (emailRegex.test(str)) {
    return { hasViolation: true, detectedType: 'Email Address', snippet: str.match(emailRegex)[0] };
  }
  if (websiteRegex.test(str)) {
    return { hasViolation: true, detectedType: 'Website URL', snippet: str.match(websiteRegex)[0] };
  }
  if (socialHandleRegex.test(str)) {
    return { hasViolation: true, detectedType: 'Social Media Handle (@username)', snippet: str.match(socialHandleRegex)[0] };
  }
  if (qrKeywords.test(str)) {
    return { hasViolation: true, detectedType: 'QR Code / Direct Contact Trigger', snippet: str.match(qrKeywords)[0] };
  }

  return { hasViolation: false };
};

module.exports = {
  isConfigured,
  getUsageToday,
  generateListingContent,
  transcribeAudio,
  improveDescription,
  ping,
  generateTitles,
  detectCategory,
  parseDemand,
  matchVendors,
  suggestPrice,
  negotiationHelper,
  detectForbiddenContactDetails,
};
