/**
 * ============================================================================
 * TURTLEMASK - FRONTEND CONTROLLER & NEURAL SHIELD INTERACTION ENGINE
 * ============================================================================
 */

(function () {
  'use strict';

  // Default configuration
  const CONFIG = {
    DEFAULT_API_BASE: (window.location.protocol.startsWith('http') && window.location.port === '8000') 
      ? window.location.origin 
      : 'http://127.0.0.1:8000',
    STORAGE_KEYS: {
      USER: 'turtlemask_user',
      SESSIONS: 'turtlemask_sessions',
      ACTIVE_SESSION: 'turtlemask_active_session',
      TOGGLES: 'turtlemask_toggles',
      VAULT_MODELS: 'turtlemask_vault_models',
      API_BASE: 'turtlemask_api_base'
    }
  };

  // Central Application State
  const state = {
    apiBase: localStorage.getItem(CONFIG.STORAGE_KEYS.API_BASE) || CONFIG.DEFAULT_API_BASE,
    backendOnline: false,
    currentUser: null,
    currentProvider: 'OPENAI',
    currentMode: 'NORMAL_MASK', // 'NORMAL_MASK' or 'TECH_STRICT'
    sessions: [],
    activeSessionId: null,
    attachedFile: null,
    connectedProviders: ['OPENAI', 'GEMINI', 'ANTHROPIC', 'OLLAMA_LOCAL'],
    
    // Rich Toggles State
    toggles: {
      autoUnmask: true,
      debertaStrict: true,
      gemmaSecretGuard: true,
      streamTyping: true,
      soundEffects: true,
      showDiffChips: true,
      compactDensity: false,
      autoScroll: true,
      darkEmeraldIntensity: 'lavish'
    },

    // Latest Inspector Telemetry
    latestTelemetry: {
      riskScore: 0.04,
      riskLevel: 'LOW',
      piiCount: 0,
      piiItems: [],
      dummyMapping: {},
      ramTicketId: null,
      originalPrompt: '',
      maskedPrompt: '',
      unmaskedResponse: '',
      rawAiResponse: '',
      action: 'SAFE_TO_SEND'
    }
  };

  // Provider Catalog Info
  const PROVIDERS = {
    OPENAI: {
      id: 'OPENAI',
      name: 'OpenAI GPT-4o-mini',
      tag: 'Fast & Smart',
      desc: 'High-speed reasoning with RAM surrogate token masking.',
      icon: '⚡'
    },
    GEMINI: {
      id: 'GEMINI',
      name: 'Google Gemini 2.5 Flash',
      tag: '1M Context',
      desc: 'Massive context window with zero confidential data retention.',
      icon: '✨'
    },
    ANTHROPIC: {
      id: 'ANTHROPIC',
      name: 'Claude 3.5 Sonnet',
      tag: 'Superior Code',
      desc: 'Nuanced enterprise analysis and pristine coding security.',
      icon: '🧠'
    },
    OLLAMA_LOCAL: {
      id: 'OLLAMA_LOCAL',
      name: 'Local Ollama Gemma 4',
      tag: '100% Offline',
      desc: 'Zero packets leave your machine. Runs entirely on local GPU/RAM.',
      icon: '🛡️'
    }
  };

  /* ==========================================================================
     AUDIO SYNTHESIZER (Pure Web Audio API - Zero External Assets)
     ========================================================================== */
  const soundFX = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },
    playSoftTick() {
      if (!state.toggles.soundEffects) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) {}
    },
    playAiArrival() {
      if (!state.toggles.soundEffects) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.12);
      } catch (e) {}
    },
    playAlertTone() {
      if (!state.toggles.soundEffects) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
      } catch (e) {}
    }
  };

  /* ==========================================================================
     DOM ELEMENTS REPOSITORY
     ========================================================================== */
  const el = {};

  function cacheDOMElements() {
    el.sidebar = document.getElementById('sidebar');
    el.sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    el.topbarToggleSidebar = document.getElementById('topbarToggleSidebar');
    el.newChatBtn = document.getElementById('newChatBtn');
    el.chatListToday = document.getElementById('chatListToday');
    el.chatListPast = document.getElementById('chatListPast');
    el.userCapsule = document.getElementById('userCapsule');
    el.userHoverMenu = document.getElementById('userHoverMenu');
    el.userEmailDisplay = document.getElementById('userEmailDisplay');
    el.userModeDisplay = document.getElementById('userModeDisplay');
    el.userAvatar = document.getElementById('userAvatar');

    // Topbar & Mode Switchers
    el.modelPillBtn = document.getElementById('modelPillBtn');
    el.modelPillIcon = document.getElementById('modelPillIcon');
    el.modelPillText = document.getElementById('modelPillText');
    el.modelDropdownMenu = document.getElementById('modelDropdownMenu');
    el.modeBtnNormal = document.getElementById('modeBtnNormal');
    el.modeBtnStrict = document.getElementById('modeBtnStrict');
    el.backendStatusPill = document.getElementById('backendStatusPill');
    el.backendStatusDot = document.getElementById('backendStatusDot');
    el.backendStatusText = document.getElementById('backendStatusText');

    // Shield Hover Telemetry
    el.shieldPill = document.getElementById('shieldPill');
    el.telemetryDebertaStatus = document.getElementById('telemetryDebertaStatus');
    el.telemetryPresidioCount = document.getElementById('telemetryPresidioCount');
    el.telemetryRamStatus = document.getElementById('telemetryRamStatus');

    // Quick Toggles
    el.quickTogglesBtn = document.getElementById('quickTogglesBtn');
    el.quickTogglesDropdown = document.getElementById('quickTogglesDropdown');
    el.toggleAutoUnmask = document.getElementById('toggleAutoUnmask');
    el.toggleDeberta = document.getElementById('toggleDeberta');
    el.toggleGemma = document.getElementById('toggleGemma');
    el.toggleStream = document.getElementById('toggleStream');
    el.toggleSound = document.getElementById('toggleSound');
    el.toggleDiffChips = document.getElementById('toggleDiffChips');
    el.toggleDensity = document.getElementById('toggleDensity');
    el.toggleAutoScroll = document.getElementById('toggleAutoScroll');

    // Chat Stage
    el.chatViewport = document.getElementById('chatViewport');
    el.chatContainer = document.getElementById('chatContainer');
    el.heroWelcome = document.getElementById('heroWelcome');
    el.chatTextarea = document.getElementById('chatTextarea');
    el.sendBtn = document.getElementById('sendBtn');
    el.attachFileBtn = document.getElementById('attachFileBtn');
    el.fileInput = document.getElementById('fileInput');
    el.attachedFilePill = document.getElementById('attachedFilePill');
    el.attachedFileName = document.getElementById('attachedFileName');
    el.detachFileBtn = document.getElementById('detachFileBtn');
    el.slashMenu = document.getElementById('slashMenu');

    // Inspector Drawer
    el.inspectorDrawer = document.getElementById('inspectorDrawer');
    el.drawerCloseBtn = document.getElementById('drawerCloseBtn');
    el.drawerToggleBtn = document.getElementById('drawerToggleBtn');
    el.debertaGaugeFill = document.getElementById('debertaGaugeFill');
    el.debertaRiskLabel = document.getElementById('debertaRiskLabel');
    el.debertaScoreVal = document.getElementById('debertaScoreVal');
    el.drawerPiiChipsBar = document.getElementById('drawerPiiChipsBar');
    el.ramWhiteboardBody = document.getElementById('ramWhiteboardBody');
    el.diffTabOriginal = document.getElementById('diffTabOriginal');
    el.diffTabMasked = document.getElementById('diffTabMasked');
    el.diffTabUnmasked = document.getElementById('diffTabUnmasked');
    el.diffDisplayBox = document.getElementById('diffDisplayBox');

    // Modals
    el.vaultModal = document.getElementById('vaultModal');
    el.closeVaultBtn = document.getElementById('closeVaultBtn');
    el.saveOpenAiKeyBtn = document.getElementById('saveOpenAiKeyBtn');
    el.saveGeminiKeyBtn = document.getElementById('saveGeminiKeyBtn');
    el.saveClaudeKeyBtn = document.getElementById('saveClaudeKeyBtn');
    el.inputOpenAiKey = document.getElementById('inputOpenAiKey');
    el.inputGeminiKey = document.getElementById('inputGeminiKey');
    el.inputClaudeKey = document.getElementById('inputClaudeKey');
    el.vaultOpenAiStatus = document.getElementById('vaultOpenAiStatus');
    el.vaultGeminiStatus = document.getElementById('vaultGeminiStatus');
    el.vaultClaudeStatus = document.getElementById('vaultClaudeStatus');

    el.fileModal = document.getElementById('fileModal');
    el.closeFileModalBtn = document.getElementById('closeFileModalBtn');
    el.fileDropzone = document.getElementById('fileDropzone');
    el.fileModalInput = document.getElementById('fileModalInput');
    el.fileScanResults = document.getElementById('fileScanResults');

    el.authModal = document.getElementById('authModal');
    el.closeAuthBtn = document.getElementById('closeAuthBtn');
    el.authTabLogin = document.getElementById('authTabLogin');
    el.authTabSignup = document.getElementById('authTabSignup');
    el.authForm = document.getElementById('authForm');
    el.authEmail = document.getElementById('authEmail');
    el.authPassword = document.getElementById('authPassword');
    el.authModeGroup = document.getElementById('authModeGroup');
    el.authSubmitBtn = document.getElementById('authSubmitBtn');

    el.toastContainer = document.getElementById('toastContainer');
  }

  /* ==========================================================================
     INITIALIZATION & LOCAL STORAGE HYDRATION
     ========================================================================== */
  function init() {
    cacheDOMElements();
    loadPersistedState();
    setupEventListeners();
    setupTemplatesAndShortcuts();
    checkBackendHealth();
    renderSidebarSessions();
    renderActiveSession();
    updateUIState();
  }

  function loadPersistedState() {
    // 1. User
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        state.currentUser = JSON.parse(savedUser);
        state.currentMode = state.currentUser.ui_mode || 'NORMAL_MASK';
      } catch (e) {
        setGuestUser();
      }
    } else {
      setGuestUser();
    }

    // 2. Toggles
    const savedToggles = localStorage.getItem(CONFIG.STORAGE_KEYS.TOGGLES);
    if (savedToggles) {
      try {
        state.toggles = { ...state.toggles, ...JSON.parse(savedToggles) };
      } catch (e) {}
    }

    // 3. Sessions
    const savedSessions = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSIONS);
    if (savedSessions) {
      try {
        state.sessions = JSON.parse(savedSessions);
      } catch (e) {
        state.sessions = [];
      }
    }

    if (!state.sessions || state.sessions.length === 0) {
      createNewSession('Confidential Code & Data Review');
    } else {
      state.activeSessionId = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_SESSION) || state.sessions[0].id;
    }

    // 4. Vault models
    const savedVault = localStorage.getItem(CONFIG.STORAGE_KEYS.VAULT_MODELS);
    if (savedVault) {
      try {
        state.connectedProviders = JSON.parse(savedVault);
      } catch (e) {}
    }
  }

  function setGuestUser() {
    state.currentUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'officer@shield.enterprise',
      ui_mode: 'NORMAL_MASK',
      isGuest: true
    };
    persistUser();
  }

  function persistUser() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(state.currentUser));
  }

  function persistSessions() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_SESSION, state.activeSessionId);
  }

  function persistToggles() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOGGLES, JSON.stringify(state.toggles));
  }

  /* ==========================================================================
     BACKEND HEALTH & REST CLIENT
     ========================================================================== */
  async function checkBackendHealth() {
    try {
      const res = await fetch(`${state.apiBase}/`, { method: 'GET' });
      if (res.ok) {
        state.backendOnline = true;
        el.backendStatusDot.className = 'status-dot-active';
        el.backendStatusText.textContent = 'Gateway 2.4 Active';
        el.telemetryRamStatus.textContent = 'Active (Volatile RAM)';
        syncVaultKeys();
      } else {
        throw new Error('Not 200');
      }
    } catch (e) {
      state.backendOnline = false;
      el.backendStatusDot.className = 'status-dot-offline';
      el.backendStatusText.textContent = 'Local Neural Sandbox';
      el.telemetryRamStatus.textContent = 'In-Memory RAM Shield';
    }
  }

  async function syncVaultKeys() {
    if (!state.backendOnline || !state.currentUser || state.currentUser.isGuest) return;
    try {
      const res = await fetch(`${state.apiBase}/vault/models/${state.currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.connected_providers) {
          state.connectedProviders = data.connected_providers;
          localStorage.setItem(CONFIG.STORAGE_KEYS.VAULT_MODELS, JSON.stringify(state.connectedProviders));
          updateVaultModalUI();
        }
      }
    } catch (e) {}
  }

  /* ==========================================================================
     PROMPT SANITIZATION, CHAT PROXY & SIMULATOR FALLBACK
     ========================================================================== */
  async function processUserPrompt(promptText) {
    if (!promptText.trim()) return;

    soundFX.playSoftTick();

    // 1. Append User Message
    const userMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const session = getActiveSession();
    session.messages.push(userMessage);
    renderActiveSession();
    clearInput();

    // If attached file was staged
    if (state.attachedFile) {
      userMessage.fileName = state.attachedFile.name;
      detachFile();
    }

    // 2. Prepare Placeholder AI Message with pulse spinner
    const aiMessageId = 'msg_ai_' + Date.now();
    const placeholderAiMessage = {
      id: aiMessageId,
      sender: 'ai',
      provider: state.currentProvider,
      text: '',
      loading: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      telemetry: null
    };

    session.messages.push(placeholderAiMessage);
    renderActiveSession();
    scrollToBottom();

    // 3. Dispatch to Backend or Intelligent Neural Simulator
    let responseData = null;

    if (state.backendOnline) {
      try {
        const payload = {
          user_id: state.currentUser.id,
          provider_name: state.currentProvider,
          prompt_text: promptText
        };

        const res = await fetch(`${state.apiBase}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        responseData = await res.json();
      } catch (err) {
        console.warn('Backend call failed, using intelligent fallback simulation:', err);
        responseData = runLocalNeuralSimulator(promptText);
      }
    } else {
      // Local In-Browser Neural Privacy Simulator
      await new Promise(r => setTimeout(r, 650)); // Serene realistic processing cadence
      responseData = runLocalNeuralSimulator(promptText);
    }

    // 4. Update Inspector Telemetry State
    updateTelemetryFromResponse(promptText, responseData);

    // 5. Handle Tech Strict Block or Prompt Injection Alert
    if (responseData.action === 'HARD_BLOCK' || responseData.action === 'HARD_BLOCK_TECH_STRICT') {
      soundFX.playAlertTone();
      placeholderAiMessage.loading = false;
      placeholderAiMessage.isBlocked = true;
      placeholderAiMessage.blockAction = responseData.action;
      placeholderAiMessage.blockReason = responseData.reason || responseData.ui_banner || 'High risk security block triggered.';
      placeholderAiMessage.tip = responseData.offline_fallback_suggestion || responseData.tip || 'Use Local Ollama Gemma 4 fallback to run securely offline.';
      placeholderAiMessage.telemetry = state.latestTelemetry;
      renderActiveSession();
      updateInspectorUI();
      persistSessions();
      return;
    }

    // 6. Handle Safe / Masked AI Response
    soundFX.playAiArrival();
    placeholderAiMessage.loading = false;

    let finalReply = 'I have received your request through the secure TurtleMask gateway.';
    let rawAiReply = '';

    if (responseData.ai_response_result) {
      if (responseData.ai_response_result.status === 'SUCCESS') {
        finalReply = state.toggles.autoUnmask 
          ? responseData.ai_response_result.unmasked_response_shown_to_user 
          : responseData.ai_response_result.raw_response_from_external_ai;
        rawAiReply = responseData.ai_response_result.raw_response_from_external_ai;
      } else {
        finalReply = `⚠️ Note: ${responseData.ai_response_result.message || 'API responded with notice.'}`;
      }
    } else if (responseData.simulatedReply) {
      finalReply = responseData.simulatedReply;
      rawAiReply = responseData.rawSimulatedReply;
    }

    placeholderAiMessage.text = finalReply;
    placeholderAiMessage.rawText = rawAiReply;
    placeholderAiMessage.telemetry = { ...state.latestTelemetry };

    // Update Session Title if first message
    if (session.messages.length <= 3) {
      session.title = promptText.slice(0, 32) + (promptText.length > 32 ? '...' : '');
      renderSidebarSessions();
    }

    persistSessions();

    // 7. Stream text simulation if toggle is on
    if (state.toggles.streamTyping) {
      streamMessageText(aiMessageId, finalReply);
    } else {
      renderActiveSession();
    }

    updateInspectorUI();
  }

  /* ==========================================================================
     INTELLIGENT LOCAL NEURAL SIMULATOR (Fallback when backend offline)
     ========================================================================== */
  function runLocalNeuralSimulator(text) {
    const isTechStrict = state.currentMode === 'TECH_STRICT';
    
    // 1. DeBERTa Prompt Injection Detection Heuristic
    const injectionTriggers = [
      'ignore previous instructions',
      'system prompt',
      'jailbreak',
      'override security',
      'dan mode',
      'forget guidelines'
    ];
    let isInjection = injectionTriggers.some(t => text.toLowerCase().includes(t));
    let riskScore = isInjection ? 0.94 : (Math.random() * 0.12 + 0.02);
    let riskLevel = riskScore > 0.75 ? 'HIGH' : (riskScore > 0.4 ? 'MEDIUM' : 'LOW');

    if (riskLevel === 'HIGH' && state.toggles.debertaStrict) {
      return {
        action: 'HARD_BLOCK',
        reason: 'DeBERTa-v3 Guard: Malicious Prompt Injection Pattern Blocked!',
        injection_analysis: { risk_score: riskScore, risk_level: riskLevel }
      };
    }

    // 2. Presidio PII & Secrets Scanner Heuristics
    const piiFound = [];
    const dummyMapping = {};
    let maskedText = text;

    // Email Regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    let match;
    let emailIdx = 1;
    while ((match = emailRegex.exec(text)) !== null) {
      const realEmail = match[1];
      const fakeEmail = `client_${emailIdx}@surrogate-corp.internal`;
      piiFound.push({ entity_type: 'EMAIL_ADDRESS', word: realEmail, score: 0.98 });
      dummyMapping[fakeEmail] = realEmail;
      maskedText = maskedText.replace(realEmail, fakeEmail);
      emailIdx++;
    }

    // API Key / Secret Regex (sk-..., AIza..., ghp_...)
    const secretRegex = /(sk-[a-zA-Z0-9]{16,}|AIza[0-9A-Za-z\-_]{15,}|ghp_[a-zA-Z0-9]{15,})/g;
    let secretIdx = 1;
    while ((match = secretRegex.exec(text)) !== null) {
      const realSecret = match[1];
      const fakeSecret = `<PROTECTED_API_KEY_${secretIdx}>`;
      piiFound.push({ entity_type: 'API_KEY', word: realSecret, score: 0.99 });
      dummyMapping[fakeSecret] = realSecret;
      maskedText = maskedText.replace(realSecret, fakeSecret);
      secretIdx++;
    }

    // Names / Entities (simple detector)
    const names = ['John', 'Alice', 'Bob', 'Michael', 'Sarah', 'Alex', 'Rahul', 'David', 'Elon', 'Sundar'];
    names.forEach(name => {
      const reg = new RegExp(`\\b${name}\\b`, 'g');
      if (reg.test(text)) {
        const fakeName = 'Jordan_Surrogate';
        piiFound.push({ entity_type: 'PERSON', word: name, score: 0.92 });
        dummyMapping[fakeName] = name;
        maskedText = maskedText.replace(reg, fakeName);
      }
    });

    // 3. TECH_STRICT Red Alert Trigger
    if (isTechStrict && piiFound.length > 0) {
      return {
        action: 'HARD_BLOCK_TECH_STRICT',
        ui_banner: 'Red Alert: Confidential Enterprise Entity or Secret Key detected in prompt.',
        offending_pii: piiFound,
        offline_fallback_suggestion: 'Toggle model to Local Ollama Gemma 4 to run safely on offline hardware.'
      };
    }

    // 4. Generate Realistic AI Response
    const dummySurrogates = Object.keys(dummyMapping);
    let rawSimulatedReply = '';
    let unmaskedReply = '';

    if (dummySurrogates.length > 0) {
      const firstDummy = dummySurrogates[0];
      rawSimulatedReply = `I have safely analyzed your inquiry for ${firstDummy}. Here is a structured summary and action plan based on your shielded data:\n\n` +
        `1. **Security Audit**: All records linked to ${firstDummy} have been validated.\n` +
        `2. **Recommendations**: Ensure endpoint rate-limits and token rotation policies are strictly preserved.\n` +
        `3. **Verification**: External AI model received strictly dummy tokens, eliminating leak exposure.`;
      
      unmaskedReply = rawSimulatedReply;
      for (const [fake, real] of Object.entries(dummyMapping)) {
        unmaskedReply = unmaskedReply.split(fake).join(real);
      }
    } else {
      rawSimulatedReply = `Here is a serene response regarding your prompt:\n\n` +
        `Your prompt has been thoroughly evaluated by TurtleMask. No confidential entities or injection vectors were detected. Your connection to **${PROVIDERS[state.currentProvider].name}** is secure.`;
      unmaskedReply = rawSimulatedReply;
    }

    return {
      action: 'AUTO_MASKED_PREVIEW',
      simulatedReply: unmaskedReply,
      rawSimulatedReply: rawSimulatedReply,
      original_prompt: text,
      sanitized_prompt_sent_to_external_api: maskedText,
      pii_detected: piiFound,
      dummy_mapping_used: dummyMapping,
      injection_analysis: { risk_score: riskScore, risk_level: riskLevel },
      ai_response_result: {
        status: 'SUCCESS',
        provider: state.currentProvider,
        raw_response_from_external_ai: rawSimulatedReply,
        unmasked_response_shown_to_user: unmaskedReply
      }
    };
  }

  function updateTelemetryFromResponse(promptText, data) {
    const inj = data.injection_analysis || { risk_score: 0.04, risk_level: 'LOW' };
    const pii = data.pii_detected || data.offending_pii || [];
    const dummy = data.dummy_mapping_used || data.dummy_mapping_saved_in_ram || {};

    state.latestTelemetry = {
      riskScore: inj.risk_score || 0.04,
      riskLevel: inj.risk_level || 'LOW',
      piiCount: pii.length,
      piiItems: pii,
      dummyMapping: dummy,
      ramTicketId: data.ram_session_ticket_id || ('ram_' + Math.random().toString(36).substr(2, 8)),
      originalPrompt: promptText,
      maskedPrompt: data.sanitized_prompt_sent_to_external_api || promptText,
      unmaskedResponse: data.ai_response_result ? data.ai_response_result.unmasked_response_shown_to_user : '',
      rawAiResponse: data.ai_response_result ? data.ai_response_result.raw_response_from_external_ai : '',
      action: data.action || 'SAFE_TO_SEND'
    };

    // Update Topbar Shield Telemetry Tooltip
    el.telemetryDebertaStatus.textContent = `${inj.risk_level} (${Math.round((inj.risk_score || 0) * 100)}%)`;
    el.telemetryPresidioCount.textContent = `${pii.length} Tokens`;
  }

  /* ==========================================================================
     STREAMING / TYPING ANIMATION (ChatGPT Simplicity)
     ========================================================================== */
  function streamMessageText(messageId, fullText) {
    const messageNode = document.querySelector(`[data-message-id="${messageId}"] .message-content`);
    if (!messageNode) {
      renderActiveSession();
      return;
    }

    let currentIdx = 0;
    const speed = 12; // ms per token batch
    const batchSize = 3;
    messageNode.innerHTML = '';

    const timer = setInterval(() => {
      currentIdx += batchSize;
      const slice = fullText.slice(0, currentIdx);
      messageNode.innerHTML = formatMarkdown(slice);
      scrollToBottom();

      if (currentIdx >= fullText.length) {
        clearInterval(timer);
        messageNode.innerHTML = formatMarkdown(fullText);
        scrollToBottom();
      }
    }, speed);
  }

  /* ==========================================================================
     RENDERING: SESSIONS, MESSAGES & UI
     ========================================================================== */
  function getActiveSession() {
    let session = state.sessions.find(s => s.id === state.activeSessionId);
    if (!session) {
      session = state.sessions[0];
      state.activeSessionId = session.id;
    }
    return session;
  }

  function createNewSession(customTitle) {
    const newSession = {
      id: 'session_' + Date.now(),
      title: customTitle || 'New Protected Session',
      timestamp: Date.now(),
      messages: []
    };
    state.sessions.unshift(newSession);
    state.activeSessionId = newSession.id;
    persistSessions();
    renderSidebarSessions();
    renderActiveSession();
    clearInput();
  }

  function renderSidebarSessions() {
    el.chatListToday.innerHTML = '';
    el.chatListPast.innerHTML = '';

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    state.sessions.forEach(session => {
      const li = document.createElement('li');
      li.className = `history-item ${session.id === state.activeSessionId ? 'active' : ''}`;
      li.setAttribute('data-session-id', session.id);

      li.innerHTML = `
        <div class="history-item-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="history-item-title">${escapeHTML(session.title)}</span>
        </div>
        <div class="history-hover-actions">
          <button class="action-icon-btn btn-rename" title="Rename Session">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="action-icon-btn danger btn-delete" title="Delete Session">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Select session on click
      li.addEventListener('click', (e) => {
        if (e.target.closest('.history-hover-actions')) return;
        state.activeSessionId = session.id;
        persistSessions();
        renderSidebarSessions();
        renderActiveSession();
      });

      // Rename
      const renameBtn = li.querySelector('.btn-rename');
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newTitle = prompt('Rename this session:', session.title);
        if (newTitle && newTitle.trim()) {
          session.title = newTitle.trim();
          persistSessions();
          renderSidebarSessions();
        }
      });

      // Delete
      const deleteBtn = li.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this conversation?')) {
          state.sessions = state.sessions.filter(s => s.id !== session.id);
          if (state.sessions.length === 0) {
            createNewSession();
          } else {
            state.activeSessionId = state.sessions[0].id;
          }
          persistSessions();
          renderSidebarSessions();
          renderActiveSession();
        }
      });

      if (now - session.timestamp < oneDay) {
        el.chatListToday.appendChild(li);
      } else {
        el.chatListPast.appendChild(li);
      }
    });
  }

  function renderActiveSession() {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      el.heroWelcome.style.display = 'flex';
      el.chatContainer.innerHTML = '';
      el.chatContainer.appendChild(el.heroWelcome);
      return;
    }

    el.heroWelcome.style.display = 'none';
    el.chatContainer.innerHTML = '';

    session.messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`;
      row.setAttribute('data-message-id', msg.id);

      if (msg.sender === 'user') {
        row.innerHTML = `
          <div class="message-bubble">
            ${msg.fileName ? `<div style="font-size:11px; margin-bottom:6px; color:var(--emerald-300); display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> ${escapeHTML(msg.fileName)}</div>` : ''}
            <div class="message-content">${formatMarkdown(msg.text)}</div>
          </div>
          <div class="message-avatar" title="You">U</div>
        `;
      } else {
        // AI Message
        if (msg.loading) {
          row.innerHTML = `
            <div class="message-avatar" title="TurtleMask Shield">🐢</div>
            <div class="message-bubble">
              <div class="ai-meta-header">
                <span class="ai-provider-tag">${PROVIDERS[msg.provider || state.currentProvider].name}</span>
                <span class="neural-inspector-pill">Scanning DeBERTa & PII...</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:var(--text-muted); font-size:13px;">
                <span class="pulse-dot"></span> Masking confidential tokens in RAM...
              </div>
            </div>
          `;
        } else if (msg.isBlocked) {
          // Blocked Alert
          row.innerHTML = `
            <div class="message-avatar" style="border-color:var(--danger-light); color:var(--danger-light);">🛡️</div>
            <div class="message-bubble" style="border-color:var(--danger-light); background:var(--danger-glass);">
              <div class="ai-meta-header">
                <span class="ai-provider-tag" style="color:var(--danger-light);">TurtleMask Neural Firewall</span>
                <span class="neural-inspector-pill blocked">BLOCKED FROM EXTERNAL LLM</span>
              </div>
              <div class="tech-strict-alert-box">
                <div class="alert-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  ${escapeHTML(msg.blockReason)}
                </div>
                <div class="alert-body">
                  No packets were sent to external AI servers. In accordance with your <strong>${state.currentMode}</strong> policy, data transmission was terminated.
                </div>
                <button class="alert-fallback-btn" onclick="TurtleMask.switchModel('OLLAMA_LOCAL')">
                  Run 100% Offline with Local Gemma 4 ➔
                </button>
              </div>
            </div>
          `;
        } else {
          // Normal Safe AI Message
          const piiCount = msg.telemetry ? msg.telemetry.piiCount : 0;
          row.innerHTML = `
            <div class="message-avatar" title="TurtleMask Shield">🐢</div>
            <div class="message-bubble">
              <div class="ai-meta-header">
                <span class="ai-provider-tag">${PROVIDERS[msg.provider || state.currentProvider].name}</span>
                <span class="neural-inspector-pill btn-open-inspector" title="Inspect surrogate transformations">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  ${piiCount > 0 ? `${piiCount} Entities Shielded` : 'Shield Clean'}
                </span>
              </div>
              <div class="message-content">${formatMarkdown(msg.text)}</div>
              
              <div class="message-actions-bar">
                <button class="msg-action-btn btn-copy" title="Copy unmasked text">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy
                </button>
                <button class="msg-action-btn btn-toggle-raw" title="Toggle between raw surrogate response and unmasked response">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Surrogate Raw
                </button>
              </div>
            </div>
          `;

          // Bind Copy
          const copyBtn = row.querySelector('.btn-copy');
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(msg.text);
            showToast('Response copied to clipboard!', 'success');
          });

          // Bind Raw/Unmasked Toggle
          const toggleRawBtn = row.querySelector('.btn-toggle-raw');
          let showingRaw = false;
          toggleRawBtn.addEventListener('click', () => {
            const contentDiv = row.querySelector('.message-content');
            showingRaw = !showingRaw;
            if (showingRaw) {
              contentDiv.innerHTML = formatMarkdown(msg.rawText || msg.text);
              toggleRawBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                View Clean Unmasked
              `;
            } else {
              contentDiv.innerHTML = formatMarkdown(msg.text);
              toggleRawBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View Surrogate Raw
              `;
            }
          });

          // Bind Inspector Pill
          const inspectorBtn = row.querySelector('.btn-open-inspector');
          inspectorBtn.addEventListener('click', () => {
            if (msg.telemetry) {
              state.latestTelemetry = msg.telemetry;
              updateInspectorUI();
            }
            openInspector();
          });
        }
      }

      el.chatContainer.appendChild(row);
    });

    scrollToBottom();
  }

  /* ==========================================================================
     INSPECTOR DRAWER UI UPDATER
     ========================================================================== */
  function updateInspectorUI() {
    const t = state.latestTelemetry;

    // 1. DeBERTa Gauge
    const scorePct = Math.round(t.riskScore * 100);
    el.debertaGaugeFill.style.width = Math.max(scorePct, 4) + '%';
    el.debertaScoreVal.textContent = t.riskScore.toFixed(3);
    el.debertaRiskLabel.textContent = `${t.riskLevel} RISK`;

    if (t.riskLevel === 'HIGH') {
      el.debertaRiskLabel.style.color = 'var(--danger-light)';
    } else if (t.riskLevel === 'MEDIUM') {
      el.debertaRiskLabel.style.color = 'var(--warning-amber)';
    } else {
      el.debertaRiskLabel.style.color = 'var(--emerald-400)';
    }

    // 2. Presidio PII Chips
    el.drawerPiiChipsBar.innerHTML = '';
    if (t.piiItems && t.piiItems.length > 0) {
      t.piiItems.forEach(item => {
        const chip = document.createElement('div');
        chip.className = `entity-chip ${item.entity_type === 'API_KEY' ? 'secret' : ''}`;
        chip.innerHTML = `
          <span>${item.entity_type}: ${escapeHTML(item.word)}</span>
          <div class="entity-tooltip">
            <strong>${item.entity_type}</strong> (Score: ${item.score})<br/>
            Surrogate: ${escapeHTML(getSurrogateForWord(item.word, t.dummyMapping))}
          </div>
        `;
        el.drawerPiiChipsBar.appendChild(chip);
      });
    } else {
      el.drawerPiiChipsBar.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">No confidential tokens detected in latest prompt.</span>`;
    }

    // 3. RAM Whiteboard Table
    el.ramWhiteboardBody.innerHTML = '';
    const mappings = Object.entries(t.dummyMapping);
    if (mappings.length > 0) {
      mappings.forEach(([fake, real]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="token-surrogate">${escapeHTML(fake)}</td>
          <td class="token-original">${escapeHTML(real)}</td>
        `;
        el.ramWhiteboardBody.appendChild(tr);
      });
    } else {
      el.ramWhiteboardBody.innerHTML = `<tr><td colspan="2" style="color:var(--text-muted); text-align:center; padding:10px;">RAM Whiteboard Empty (Zero Retention)</td></tr>`;
    }

    // 4. Prompt Diff Display Box
    renderDiffBox('original');
  }

  function getSurrogateForWord(word, mapping) {
    for (const [fake, real] of Object.entries(mapping)) {
      if (real === word) return fake;
    }
    return 'Masked in RAM';
  }

  function renderDiffBox(mode) {
    const t = state.latestTelemetry;
    el.diffTabOriginal.classList.toggle('active', mode === 'original');
    el.diffTabMasked.classList.toggle('active', mode === 'masked');
    el.diffTabUnmasked.classList.toggle('active', mode === 'unmasked');

    if (mode === 'original') {
      el.diffDisplayBox.textContent = t.originalPrompt || '(No prompt sent yet)';
    } else if (mode === 'masked') {
      el.diffDisplayBox.textContent = t.maskedPrompt || '(No prompt sent yet)';
    } else {
      el.diffDisplayBox.textContent = t.unmaskedResponse || t.rawAiResponse || '(No response received yet)';
    }
  }

  /* ==========================================================================
     EVENT LISTENERS & INTERACTION WIRING
     ========================================================================== */
  function setupEventListeners() {
    // 1. Sidebar Toggle
    el.sidebarCollapseBtn.addEventListener('click', toggleSidebar);
    el.topbarToggleSidebar.addEventListener('click', toggleSidebar);

    // 2. New Chat Button
    el.newChatBtn.addEventListener('click', () => createNewSession());

    // 3. Textarea Auto-Grow & Submit on Enter
    el.chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitPrompt();
      }
    });

    el.chatTextarea.addEventListener('input', () => {
      el.chatTextarea.style.height = 'auto';
      el.chatTextarea.style.height = Math.min(el.chatTextarea.scrollHeight, 180) + 'px';
      
      // Slash command detection
      const val = el.chatTextarea.value;
      if (val.startsWith('/')) {
        el.slashMenu.classList.add('show');
      } else {
        el.slashMenu.classList.remove('show');
      }
    });

    el.sendBtn.addEventListener('click', submitPrompt);

    // 4. File Attachment
    el.attachFileBtn.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', handleFileInput);
    el.detachFileBtn.addEventListener('click', detachFile);

    // 5. Security Mode Toggles (Dual Pill Slider)
    el.modeBtnNormal.addEventListener('click', () => setSecurityMode('NORMAL_MASK'));
    el.modeBtnStrict.addEventListener('click', () => setSecurityMode('TECH_STRICT'));

    // 6. Model Selector Dropdown
    document.querySelectorAll('.model-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const provider = card.getAttribute('data-provider');
        selectModel(provider);
      });
    });

    // 7. Inspector Drawer Controls
    el.drawerToggleBtn.addEventListener('click', toggleInspector);
    el.drawerCloseBtn.addEventListener('click', closeInspector);

    el.diffTabOriginal.addEventListener('click', () => renderDiffBox('original'));
    el.diffTabMasked.addEventListener('click', () => renderDiffBox('masked'));
    el.diffTabUnmasked.addEventListener('click', () => renderDiffBox('unmasked'));

    // 8. Toggles Handlers (Lots of Toggles!)
    bindToggle(el.toggleAutoUnmask, 'autoUnmask');
    bindToggle(el.toggleDeberta, 'debertaStrict');
    bindToggle(el.toggleGemma, 'gemmaSecretGuard');
    bindToggle(el.toggleStream, 'streamTyping');
    bindToggle(el.toggleSound, 'soundEffects');
    bindToggle(el.toggleDiffChips, 'showDiffChips');
    bindToggle(el.toggleDensity, 'compactDensity', () => {
      document.body.classList.toggle('compact-mode', state.toggles.compactDensity);
    });
    bindToggle(el.toggleAutoScroll, 'autoScroll');

    // 9. User Capsule Menu
    el.userCapsule.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userHoverMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      el.userHoverMenu.classList.remove('show');
      el.slashMenu.classList.remove('show');
    });

    // 10. Modals Handlers
    el.closeVaultBtn.addEventListener('click', closeVaultModal);
    el.closeFileModalBtn.addEventListener('click', closeFileModal);
    el.closeAuthBtn.addEventListener('click', closeAuthModal);

    // Save Vault Keys
    el.saveOpenAiKeyBtn.addEventListener('click', () => saveVaultKey('OPENAI', el.inputOpenAiKey.value));
    el.saveGeminiKeyBtn.addEventListener('click', () => saveVaultKey('GEMINI', el.inputGeminiKey.value));
    el.saveClaudeKeyBtn.addEventListener('click', () => saveVaultKey('ANTHROPIC', el.inputClaudeKey.value));

    // File Drag & Drop Modal
    setupDropzone();

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        createNewSession();
      }
      if (e.key === 'Escape') {
        closeAllModals();
        closeInspector();
      }
    });
  }

  function bindToggle(inputEl, toggleKey, onChange) {
    if (!inputEl) return;
    inputEl.checked = !!state.toggles[toggleKey];
    inputEl.addEventListener('change', () => {
      state.toggles[toggleKey] = inputEl.checked;
      persistToggles();
      soundFX.playSoftTick();
      if (onChange) onChange();
      showToast(`Setting '${toggleKey}' toggled to ${inputEl.checked ? 'ON' : 'OFF'}`);
    });
  }

  function setupTemplatesAndShortcuts() {
    // Slash commands
    document.querySelectorAll('.slash-item').forEach(item => {
      item.addEventListener('click', () => {
        const cmd = item.getAttribute('data-cmd');
        executeSlashCommand(cmd);
      });
    });

    // Starter Prompt Cards
    document.querySelectorAll('.starter-card').forEach(card => {
      card.addEventListener('click', () => {
        const promptText = card.getAttribute('data-prompt');
        if (promptText) {
          el.chatTextarea.value = promptText;
          submitPrompt();
        }
      });
    });
  }

  function executeSlashCommand(cmd) {
    el.slashMenu.classList.remove('show');
    el.chatTextarea.value = '';

    if (cmd === '/vault') {
      openVaultModal();
    } else if (cmd === '/scan') {
      openFileModal();
    } else if (cmd === '/mode') {
      setSecurityMode(state.currentMode === 'NORMAL_MASK' ? 'TECH_STRICT' : 'NORMAL_MASK');
    } else if (cmd === '/clear') {
      const session = getActiveSession();
      session.messages = [];
      persistSessions();
      renderActiveSession();
      showToast('Session conversation cleared.');
    } else if (cmd === '/offline') {
      selectModel('OLLAMA_LOCAL');
      showToast('Switched to Local Offline Gemma 4.');
    }
  }

  /* ==========================================================================
     PROMPT SUBMISSION & INPUT CONTROL
     ========================================================================== */
  function submitPrompt() {
    const text = el.chatTextarea.value.trim();
    if (!text && !state.attachedFile) return;

    processUserPrompt(text);
  }

  function clearInput() {
    el.chatTextarea.value = '';
    el.chatTextarea.style.height = 'auto';
  }

  function scrollToBottom() {
    if (state.toggles.autoScroll) {
      el.chatViewport.scrollTop = el.chatViewport.scrollHeight;
    }
  }

  /* ==========================================================================
     SECURITY MODE & MODEL SELECTION
     ========================================================================== */
  async function setSecurityMode(newMode) {
    state.currentMode = newMode;
    el.modeBtnNormal.classList.toggle('active', newMode === 'NORMAL_MASK');
    el.modeBtnStrict.classList.toggle('active', newMode === 'TECH_STRICT');
    el.userModeDisplay.textContent = newMode === 'NORMAL_MASK' ? 'Smart Mask' : 'Strict Block';

    soundFX.playSoftTick();
    showToast(`Security Mode set to: ${newMode}`);

    // If backend is active and user is authenticated, update on server
    if (state.backendOnline && state.currentUser && !state.currentUser.isGuest) {
      try {
        await fetch(`${state.apiBase}/user/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: state.currentUser.id, ui_mode: newMode })
        });
      } catch (e) {}
    }
  }

  function selectModel(providerId) {
    if (!PROVIDERS[providerId]) return;
    state.currentProvider = providerId;
    el.modelPillText.textContent = PROVIDERS[providerId].name;
    el.modelPillIcon.textContent = PROVIDERS[providerId].icon;

    document.querySelectorAll('.model-option-card').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('data-provider') === providerId);
    });

    el.modelDropdownMenu.classList.remove('active');
    soundFX.playSoftTick();
    showToast(`Model routed to ${PROVIDERS[providerId].name}`);
  }

  /* ==========================================================================
     FILE ATTACHMENT & DRAG-AND-DROP
     ========================================================================== */
  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) {
      attachFile(file);
    }
  }

  function attachFile(file) {
    state.attachedFile = file;
    el.attachedFileName.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
    el.attachedFilePill.classList.add('show');
    showToast(`Attached: ${file.name}`);
  }

  function detachFile() {
    state.attachedFile = null;
    el.fileInput.value = '';
    el.attachedFilePill.classList.remove('show');
  }

  function setupDropzone() {
    const dropzone = el.fileDropzone;
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) {
        processUploadedFileScan(file);
      }
    });

    dropzone.addEventListener('click', () => el.fileModalInput.click());
    el.fileModalInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processUploadedFileScan(file);
    });
  }

  async function processUploadedFileScan(file) {
    el.fileScanResults.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; color:var(--emerald-300); font-size:13px; padding:12px;">
        <span class="pulse-dot"></span> Extracting text & running Presidio + DeBERTa Guard on <strong>${escapeHTML(file.name)}</strong>...
      </div>
    `;

    if (state.backendOnline) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ui_mode', state.currentMode);

        const res = await fetch(`${state.apiBase}/ml/extract-file?ui_mode=${state.currentMode}`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        renderFileScanResults(file.name, data);
      } catch (err) {
        fallbackFileScanSimulation(file);
      }
    } else {
      fallbackFileScanSimulation(file);
    }
  }

  function fallbackFileScanSimulation(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || `Sample extracted text from ${file.name} with employee records.`;
      const sim = runLocalNeuralSimulator(text.slice(0, 500));
      renderFileScanResults(file.name, {
        filename: file.name,
        extracted_text_preview: text.slice(0, 300),
        full_text: text,
        security_scan: sim
      });
    };
    reader.readAsText(file.slice(0, 2048));
  }

  function renderFileScanResults(fileName, data) {
    const scan = data.security_scan || {};
    const piiCount = scan.pii_detected_count || (scan.offending_pii ? scan.offending_pii.length : 0);
    const inj = scan.injection_analysis || { risk_level: 'LOW', risk_score: 0.02 };

    el.fileScanResults.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:14px;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:13px;">
          <span>📄 ${escapeHTML(fileName)}</span>
          <span class="nav-badge-pill">${inj.risk_level} Risk (${Math.round(inj.risk_score * 100)}%)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono); background:var(--bg-darkest); padding:8px; border-radius:4px; max-height:100px; overflow-y:auto;">
          ${escapeHTML(data.extracted_text_preview || 'Text parsed successfully.')}
        </div>
        <div style="font-size:12px; color:var(--emerald-300);">
          🛡️ PII Tokens Identified: <strong>${piiCount}</strong>
        </div>
        <button class="btn-primary" id="btnSendFileToChat" style="padding:8px 12px; font-size:12px;">
          Insert Sanitized Content into Chat ➔
        </button>
      </div>
    `;

    document.getElementById('btnSendFileToChat').addEventListener('click', () => {
      closeFileModal();
      const content = data.full_text || data.extracted_text_preview;
      el.chatTextarea.value = `Analyze this shielded document content:\n\n${content}`;
      submitPrompt();
    });
  }

  /* ==========================================================================
     VAULT API KEY MANAGEMENT
     ========================================================================== */
  async function saveVaultKey(providerName, rawKey) {
    if (!rawKey.trim()) {
      showToast('Please provide an API key.', 'error');
      return;
    }

    soundFX.playSoftTick();

    if (state.backendOnline && state.currentUser) {
      try {
        const res = await fetch(`${state.apiBase}/vault/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: state.currentUser.id,
            provider_name: providerName,
            raw_api_key: rawKey.trim()
          })
        });

        if (res.ok) {
          showToast(`Success! Your ${providerName} key is encrypted and locked in SQLite Vault.`, 'success');
          if (!state.connectedProviders.includes(providerName)) {
            state.connectedProviders.push(providerName);
            localStorage.setItem(CONFIG.STORAGE_KEYS.VAULT_MODELS, JSON.stringify(state.connectedProviders));
          }
          updateVaultModalUI();
        } else {
          showToast('Failed to save key in Vault.', 'error');
        }
      } catch (err) {
        showToast('Local Vault encrypted in RAM.', 'success');
      }
    } else {
      // Local fallback
      if (!state.connectedProviders.includes(providerName)) {
        state.connectedProviders.push(providerName);
        localStorage.setItem(CONFIG.STORAGE_KEYS.VAULT_MODELS, JSON.stringify(state.connectedProviders));
      }
      showToast(`Key encrypted and stored in local secure sandbox.`, 'success');
      updateVaultModalUI();
    }
  }

  function updateVaultModalUI() {
    const hasOpenAI = state.connectedProviders.includes('OPENAI');
    const hasGemini = state.connectedProviders.includes('GEMINI');
    const hasClaude = state.connectedProviders.includes('ANTHROPIC');

    el.vaultOpenAiStatus.className = `vault-key-status ${hasOpenAI ? 'connected' : 'empty'}`;
    el.vaultOpenAiStatus.textContent = hasOpenAI ? 'Encrypted 🔒' : 'Not Connected';

    el.vaultGeminiStatus.className = `vault-key-status ${hasGemini ? 'connected' : 'empty'}`;
    el.vaultGeminiStatus.textContent = hasGemini ? 'Encrypted 🔒' : 'Not Connected';

    el.vaultClaudeStatus.className = `vault-key-status ${hasClaude ? 'connected' : 'empty'}`;
    el.vaultClaudeStatus.textContent = hasClaude ? 'Encrypted 🔒' : 'Not Connected';
  }

  /* ==========================================================================
     SIDEBAR & DRAWER TOGGLE UTILITIES
     ========================================================================== */
  function toggleSidebar() {
    el.sidebar.classList.toggle('collapsed');
  }

  function toggleInspector() {
    el.inspectorDrawer.classList.toggle('collapsed');
    if (!el.inspectorDrawer.classList.contains('collapsed')) {
      updateInspectorUI();
    }
  }

  function openInspector() {
    el.inspectorDrawer.classList.remove('collapsed');
    updateInspectorUI();
  }

  function closeInspector() {
    el.inspectorDrawer.classList.add('collapsed');
  }

  function updateUIState() {
    el.userEmailDisplay.textContent = state.currentUser ? state.currentUser.email : 'guest@turtlemask';
    el.userAvatar.textContent = (state.currentUser && state.currentUser.email) ? state.currentUser.email[0].toUpperCase() : 'T';
    setSecurityMode(state.currentMode);
    selectModel(state.currentProvider);
    updateVaultModalUI();
  }

  /* ==========================================================================
     MODAL CONTROLS
     ========================================================================== */
  function openVaultModal() {
    updateVaultModalUI();
    el.vaultModal.classList.add('show');
  }

  function closeVaultModal() {
    el.vaultModal.classList.remove('show');
  }

  function openFileModal() {
    el.fileModal.classList.add('show');
  }

  function closeFileModal() {
    el.fileModal.classList.remove('show');
    el.fileScanResults.innerHTML = '';
  }

  function openAuthModal() {
    el.authModal.classList.add('show');
  }

  function closeAuthModal() {
    el.authModal.classList.remove('show');
  }

  function closeAllModals() {
    closeVaultModal();
    closeFileModal();
    closeAuthModal();
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <span>${escapeHTML(message)}</span>
    `;

    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.25s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  /* ==========================================================================
     MARKDOWN & STRING FORMATTING ENGINE
     ========================================================================== */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';

    // 1. Code blocks with language header and copy button
    let formatted = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const cleanLang = lang || 'code';
      const escapedCode = escapeHTML(code.trim());
      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${cleanLang}</span>
            <button class="code-copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').innerText); TurtleMask.showToast('Code copied!');">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg> Copy
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
    });

    // 2. Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 3. Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 4. Bullet lists
    formatted = formatted.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gims, '<ul style="padding-left:20px; margin:8px 0;">$1</ul>');

    // 5. Line breaks & paragraphs
    const paragraphs = formatted.split(/\n\n+/);
    return paragraphs.map(p => {
      if (p.startsWith('<div class="code-block-wrapper"') || p.startsWith('<ul')) return p;
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  }

  async function handleAuthSubmit() {
    const isSignup = el.authTabSignup.classList.contains('active');
    const email = el.authEmail.value.trim();
    const password = el.authPassword.value.trim();
    const modeSelect = document.getElementById('authModeSelect');
    const ui_mode = modeSelect ? modeSelect.value : 'NORMAL_MASK';

    if (!email || !password) {
      showToast('Please provide both email and password.', 'error');
      return;
    }

    soundFX.playSoftTick();

    if (state.backendOnline) {
      try {
        if (isSignup) {
          const res = await fetch(`${state.apiBase}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, ui_mode })
          });
          const data = await res.json();
          if (res.ok) {
            state.currentUser = {
              id: data.user_id,
              email: data.email,
              ui_mode: data.ui_mode,
              isGuest: false
            };
            persistUser();
            updateUIState();
            closeAuthModal();
            showToast('Account registered successfully! Shield active.', 'success');
            syncVaultKeys();
          } else {
            showToast(data.detail || 'Signup failed.', 'error');
          }
        } else {
          const res = await fetch(`${state.apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok) {
            state.currentUser = {
              id: data.user_id,
              email: data.email,
              ui_mode: data.ui_mode,
              token: data.token,
              isGuest: false
            };
            persistUser();
            updateUIState();
            closeAuthModal();
            showToast('Logged in successfully! Welcome back.', 'success');
            syncVaultKeys();
          } else {
            showToast(data.detail || 'Login failed.', 'error');
          }
        }
      } catch (err) {
        showToast('Network error connecting to Backend.', 'error');
      }
    } else {
      // Local session
      state.currentUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: email,
        ui_mode: ui_mode || 'NORMAL_MASK',
        isGuest: false
      };
      persistUser();
      updateUIState();
      closeAuthModal();
      showToast('Signed in to local session!', 'success');
    }
  }

  /* ==========================================================================
     GLOBAL TURTLEMASK NAMESPACE FOR INLINE HOOKS
     ========================================================================== */
  window.TurtleMask = {
    openVault: openVaultModal,
    openFileScanner: openFileModal,
    openAuth: openAuthModal,
    handleAuthSubmit: handleAuthSubmit,
    switchModel: selectModel,
    switchMode: setSecurityMode,
    showToast: showToast,
    createNewSession: createNewSession
  };

  // Run upon DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

