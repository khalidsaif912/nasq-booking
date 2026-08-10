/**
 * نَسْق — منطق مشترك (إعدادات عامة + حجوزات + تعارض المواعيد + ICS)
 * التخزين: localStorage + ملف site-settings.json (للزوار)
 * لنشر الإعدادات للجميع: من لوحة الإدارة «حفظ ونشر» ثم ارفع site-settings.json
 */
(function (global) {
  'use strict';

  const SETTINGS_KEY = 'nasq_site_settings_v2';
  const BOOKINGS_KEY = 'nasq_consult_bookings_v1';
  const ADMIN_SESSION = 'nasq_admin_session_v1';
  /* غيّر كلمة المرور من لوحة الإدارة بعد الدخول */
  const DEFAULT_ADMIN_PASS = 'nasq@admin';

  const PHOTO_BACKGROUNDS = [
    { file: 'assets/bg-umbrella-sakura.png', label: 'مظلّة تحت الساكورا' },
    { file: 'assets/bg-serene.png', label: 'غرفة وزهور' },
    { file: 'assets/bg-rose-beach.png', label: 'وردة على الشاطئ' },
    { file: 'assets/bg-purple-window.png', label: 'نافذة بنفسجية' },
    { file: 'assets/bg-seaside-cafe.png', label: 'مقهى على البحر' },
    { file: 'assets/bg-cozy-morning.png', label: 'صباح هادئ' },
    { file: 'assets/bg-meditation-green.png', label: 'هدوء الطبيعة' }
  ];

  const DESIGN_MODES = [
    { id: 'material', name: 'Material' },
    { id: 'glass', name: 'Glass' },
    { id: 'flat', name: 'Flat' },
    { id: 'cyber', name: 'Cyber' },
    { id: 'default', name: 'افتراضي' }
  ];

  const DEFAULT_TEXTS = {
    brandName: 'نَسْق',
    brandTag: 'استشارة نفسية واجتماعية',
    brandMark: 'ن',
    heroTitle: 'نَسْق',
    heroEm: 'مساحتك الآمنة للتحدث والاستشارة',
    heroLead: 'مكان دافئ ولطيف لتكون كما أنت. نستمع إليك بهدوء، ونرافقك في فهم مشاعرك وعلاقاتك بخطوات مرنة وآمنة.',
    bookCta: 'احجز جلسة الآن',
    heartLine1: 'هنا مساحة',
    heartLine2: 'للتحدّث… بلا أحكام',
    heartLine3: 'خصوصية · لطف · جلسات عبر Zoom',
    stat1Num: '٦٠',
    stat1Label: 'دقيقة لك',
    stat2Num: '١٠٠٪',
    stat2Label: 'سرّية تامة',
    bookingTitle: 'اختر وقتاً يناسبك',
    bookingLead: 'خطوات بسيطة ومتتابعة: نوع الاهتمام، ثم اليوم والوقت، ثم نبذة عنك.',
    step1Title: 'بماذا نحتاج أن نهتم معاً؟',
    step2Title: 'اختر اليوم والوقت',
    step3Title: 'نبذة عنك',
    confirmBtn: 'أؤكد الجلسة بلطف',
    summaryEmpty: 'عندما تختار موعداً، سيظهر هنا بهدوء.',
    footer: 'نَسْق · مساحة آمنة للاستشارة النفسية والاجتماعية · 2026',
    typePsychTitle: 'استشارة نفسية',
    typePsychDesc: 'القلق، التوتر، الحزن، أو الحاجة لهدوء داخلي',
    typeSocialTitle: 'استشارة اجتماعية',
    typeSocialDesc: 'ضغوط الحياة، التكيّف، والدعم في المواقف اليومية',
    typeFamilyTitle: 'علاقات وأسرة',
    typeFamilyDesc: 'التواصل، الحدود، وفهم من حولك بمزيد من الحنان',
    typeOtherTitle: 'شيء آخر على قلبك',
    typeOtherDesc: 'اكتبه في الملاحظات… كل ما يهمّك له مكان هنا',
    expectTitle: 'ما يمكن أن تتوقّعه',
    expectDuration: 'ساعة كاملة لك، بلا استعجال',
    expectTone: 'استشارة نفسية واجتماعية بلغة هادئة',
    expectPrivacy: 'ما تشاركه يبقى بينكما',
    expectPlace: 'جلسة مريحة عن بُعد عبر Zoom',
    doneTitle: 'موعدك محجوز بكل هدوء',
    nameLabel: 'الاسم الذي تفضّل أن نناديك به',
    phoneLabel: 'رقم الهاتف',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    notesLabel: 'ما الذي يثقل قلبك اليوم؟ (اختياري)'
  };

  function defaultSettings() {
    return {
      version: 2,
      photoIndex: 0,
      designMode: 'default',
      shuffle: null,
      transparency: {
        hearts: 0.92,
        panels: 0.88,
        menus: 0.9
      },
      hours: {
        startHour: 9,
        endHour: 17,
        slotDurationMins: 60
      },
      whatsAppBusinessDigits: '96599717016',
      texts: Object.assign({}, DEFAULT_TEXTS),
      adminPassword: DEFAULT_ADMIN_PASS,
      remoteSettingsUrl: '',
      updatedAt: new Date().toISOString()
    };
  }

  function deepMerge(base, over) {
    if (!over || typeof over !== 'object') return base;
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over).forEach((k) => {
      if (
        over[k] &&
        typeof over[k] === 'object' &&
        !Array.isArray(over[k]) &&
        base[k] &&
        typeof base[k] === 'object'
      ) {
        out[k] = deepMerge(base[k], over[k]);
      } else if (over[k] !== undefined) {
        out[k] = over[k];
      }
    });
    return out;
  }

  function readLocalSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeLocalSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(SETTINGS_KEY + '_ts', String(Date.now()));
    } catch (e) {}
  }

  async function fetchFileSettings() {
    try {
      const base = getAssetBaseRoot();
      const url = new URL('site-settings.json?t=' + Date.now(), location.origin + base).href;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function fetchRemoteSettings(url) {
    if (!url) return null;
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), {
        cache: 'no-store'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  /**
   * أولوية: remote URL (إن وُجدت في local) ثم localStorage (أحدَث) ثم site-settings.json
   */
  async function loadSettings() {
    const base = defaultSettings();
    const local = readLocalSettings();
    const file = await fetchFileSettings();
    let remote = null;
    const probe = local || file || base;
    if (probe.remoteSettingsUrl) {
      remote = await fetchRemoteSettings(probe.remoteSettingsUrl);
    }

    let merged = base;
    if (file) merged = deepMerge(merged, file);
    if (remote) merged = deepMerge(merged, remote);

    // local يغلب إن كان أحدَث من الملف (إدارة من نفس الجهاز)
    if (local) {
      const localTs = Date.parse(local.updatedAt || 0) || 0;
      const fileTs = Date.parse((file && file.updatedAt) || 0) || 0;
      const remoteTs = Date.parse((remote && remote.updatedAt) || 0) || 0;
      if (localTs >= fileTs && localTs >= remoteTs) {
        merged = deepMerge(merged, local);
      }
    }

    // ضمان النصوص كاملة
    merged.texts = Object.assign({}, DEFAULT_TEXTS, (merged.texts || {}));
    merged.transparency = Object.assign(
      { hearts: 0.92, panels: 0.88, menus: 0.9 },
      merged.transparency || {}
    );
    merged.hours = Object.assign(
      { startHour: 9, endHour: 17, slotDurationMins: 60 },
      merged.hours || {}
    );
    return merged;
  }

  function saveSettings(settings) {
    const next = deepMerge(defaultSettings(), settings || {});
    next.texts = Object.assign({}, DEFAULT_TEXTS, next.texts || {});
    next.updatedAt = new Date().toISOString();
    writeLocalSettings(next);
    try {
      window.dispatchEvent(new CustomEvent('nasq-settings-changed', { detail: next }));
    } catch (e) {}
    return next;
  }

  function settingsToDownloadBlob(settings) {
    const pretty = JSON.stringify(settings, null, 2);
    return new Blob([pretty], { type: 'application/json;charset=utf-8' });
  }

  function downloadSettingsFile(settings, filename) {
    const blob = settingsToDownloadBlob(settings);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'site-settings.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function getAssetBaseRoot() {
    let root = location.pathname || '/';
    if (/\.[a-zA-Z0-9]+$/.test(root)) root = root.replace(/\/[^/]*$/, '/');
    if (!root.endsWith('/')) root += '/';
    return root;
  }

  function photoBackgroundUrl(file) {
    return new URL(file + '?v=7', location.origin + getAssetBaseRoot()).href;
  }

  function applyPhotoIndex(index) {
    const i =
      ((index % PHOTO_BACKGROUNDS.length) + PHOTO_BACKGROUNDS.length) % PHOTO_BACKGROUNDS.length;
    const item = PHOTO_BACKGROUNDS[i];
    const url = photoBackgroundUrl(item.file);
    document.documentElement.style.setProperty('--photo-bg', 'url("' + url + '")');
    return i;
  }

  function applyDesignMode(modeId) {
    const body = document.body;
    body.classList.remove(
      'design-material',
      'design-glass',
      'design-flat',
      'design-cyber',
      'design-default'
    );
    const id = modeId || 'default';
    if (id !== 'default') body.classList.add('design-' + id);
  }

  function applyTransparency(t) {
    t = t || {};
    const hearts = clamp01(t.hearts == null ? 0.92 : t.hearts);
    const panels = clamp01(t.panels == null ? 0.88 : t.panels);
    const menus = clamp01(t.menus == null ? 0.9 : t.menus);
    const root = document.documentElement;
    root.style.setProperty('--heart-opacity', String(hearts));
    root.style.setProperty('--panel-opacity', String(panels));
    root.style.setProperty('--menu-opacity', String(menus));
  }

  function clamp01(n) {
    n = Number(n);
    if (Number.isNaN(n)) return 1;
    return Math.min(1, Math.max(0.25, n));
  }

  function applyTexts(texts) {
    texts = Object.assign({}, DEFAULT_TEXTS, texts || {});
    document.querySelectorAll('[data-text]').forEach((el) => {
      const key = el.getAttribute('data-text');
      if (!key || texts[key] == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('data-text-placeholder')) el.placeholder = texts[key];
        else el.value = texts[key];
      } else if (el.hasAttribute('data-text-html')) {
        el.innerHTML = texts[key];
      } else {
        el.textContent = texts[key];
      }
    });
    // تسميات النوع
    const map = [
      ['نفسية', 'typePsychTitle', 'typePsychDesc'],
      ['اجتماعية', 'typeSocialTitle', 'typeSocialDesc'],
      ['علاقات وأسرية', 'typeFamilyTitle', 'typeFamilyDesc'],
      ['موضوع آخر', 'typeOtherTitle', 'typeOtherDesc']
    ];
    map.forEach(([val, tKey, dKey]) => {
      const input = document.querySelector(
        'input[name="consultType"][value="' + val + '"]'
      );
      if (!input) return;
      const card = input.closest('.type-option');
      if (!card) return;
      const strong = card.querySelector('strong');
      const span = card.querySelector('.type-option-body > span, span:not(.type-option-check)');
      if (strong && texts[tKey]) strong.textContent = texts[tKey];
      if (span && texts[dKey]) span.textContent = texts[dKey];
    });
  }

  function applyShuffleFromSettings(shuffle) {
    if (!shuffle || !shuffle.color) return false;
    try {
      if (typeof global.applyShuffleBg === 'function') {
        global.applyShuffleBg(
          shuffle.color,
          shuffle.pattern || '',
          shuffle.h != null
            ? { h: shuffle.h, s: shuffle.s, l: shuffle.l, color: shuffle.color }
            : undefined
        );
        return true;
      }
    } catch (e) {}
    return false;
  }

  function applySettingsToPage(settings, opts) {
    opts = opts || {};
    if (!settings) return;
    applyPhotoIndex(settings.photoIndex || 0);
    applyDesignMode(settings.designMode || 'default');
    applyTransparency(settings.transparency);
    applyTexts(settings.texts);
    if (settings.shuffle) applyShuffleFromSettings(settings.shuffle);
    if (opts.syncConfigObject && global.CONFIG) {
      const h = settings.hours || {};
      if (h.startHour != null) global.CONFIG.startHour = Number(h.startHour);
      if (h.endHour != null) global.CONFIG.endHour = Number(h.endHour);
      if (h.slotDurationMins != null)
        global.CONFIG.slotDurationMins = Number(h.slotDurationMins);
      if (settings.whatsAppBusinessDigits != null)
        global.CONFIG.whatsAppBusinessDigits = String(settings.whatsAppBusinessDigits);
    }
  }

  /* —— حجوزات —— */
  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setBookings(list) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list || []));
    try {
      window.dispatchEvent(new CustomEvent('nasq-bookings-changed'));
    } catch (e) {}
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function timeToMinutes(timeStr) {
    const parts = String(timeStr || '0:0').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function rangesOverlap(a0, a1, b0, b1) {
    return a0 < b1 && b0 < a1;
  }

  function bookingRange(b, slotMins) {
    const start = timeToMinutes(b.time);
    const dur = Number(b.durationMins || slotMins || 60);
    return [start, start + dur];
  }

  function findConflicts(dateStr, timeStr, durationMins, exceptId) {
    const all = getBookings();
    const slot = Number(durationMins || 60);
    const [s0, s1] = [timeToMinutes(timeStr), timeToMinutes(timeStr) + slot];
    return all.filter((b) => {
      if (b.date !== dateStr) return false;
      if (exceptId && b.id === exceptId) return false;
      const [b0, b1] = bookingRange(b, slot);
      return rangesOverlap(s0, s1, b0, b1);
    });
  }

  function isSlotTaken(dateStr, timeStr, durationMins, exceptId) {
    return findConflicts(dateStr, timeStr, durationMins, exceptId).length > 0;
  }

  function isWithinWorkingHours(h, m, hoursCfg) {
    hoursCfg = hoursCfg || { startHour: 9, endHour: 17, slotDurationMins: 60 };
    const start = Number(hoursCfg.startHour) * 60;
    const dayEnd = Number(hoursCfg.endHour) * 60;
    const slot = Number(hoursCfg.slotDurationMins || 60);
    // آخر موعد يبدأ بحيث تنتهي الجلسة عند endHour أو قبله
    const lastStart = dayEnd - slot;
    const t = Number(h) * 60 + Number(m);
    return t >= start && t <= lastStart;
  }

  function workingHoursLabel(hoursCfg, formatDisplayFn) {
    hoursCfg = hoursCfg || { startHour: 9, endHour: 17, slotDurationMins: 60 };
    const last =
      Number(hoursCfg.endHour) * 60 - Number(hoursCfg.slotDurationMins || 60);
    const lh = Math.floor(last / 60);
    const lm = last % 60;
    if (typeof formatDisplayFn === 'function') {
      return (
        formatDisplayFn(hoursCfg.startHour, 0) +
        ' – ' +
        formatDisplayFn(lh, lm)
      );
    }
    return pad2(hoursCfg.startHour) + ':00 – ' + pad2(lh) + ':' + pad2(lm);
  }

  function saveBooking(booking) {
    const all = getBookings();
    if (!booking.id) booking.id = 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    if (!booking.durationMins) booking.durationMins = 60;
    all.push(booking);
    setBookings(all);
    return booking;
  }

  function deleteBooking(id) {
    setBookings(getBookings().filter((b) => b.id !== id));
  }

  function updateBooking(id, patch) {
    const all = getBookings().map((b) => (b.id === id ? Object.assign({}, b, patch) : b));
    setBookings(all);
  }

  /* —— ICS —— */
  function toIcsLocalDateTime(d) {
    return (
      d.getFullYear() +
      pad2(d.getMonth() + 1) +
      pad2(d.getDate()) +
      'T' +
      pad2(d.getHours()) +
      pad2(d.getMinutes()) +
      pad2(d.getSeconds())
    );
  }

  function toIcsUtcStamp(d) {
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      'T' +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      'Z'
    );
  }

  function escapeIcsText(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function buildSessionStartDate(dateStr, timeStr) {
    const [h, m] = String(timeStr).split(':').map(Number);
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  function buildIcsContent(booking, durationMins) {
    const dur = Number(booking.durationMins || durationMins || 60);
    const start = buildSessionStartDate(booking.date, booking.time);
    const end = new Date(start.getTime() + dur * 60000);
    const title = `جلسة نَسْق — ${booking.type || 'استشارة'}`;
    const desc = [
      'جلسة استشارة عبر نَسْق',
      'الاسم: ' + (booking.name || ''),
      'النوع: ' + (booking.type || ''),
      'الجوال: ' + (booking.phone || ''),
      booking.email ? 'البريد: ' + booking.email : '',
      booking.notes ? 'ملاحظات: ' + booking.notes : '',
      'المكان: Zoom'
    ]
      .filter(Boolean)
      .join('\n');
    const uid = 'nasq-' + (booking.id || Date.now()) + '@nasq';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nasq//Admin//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + toIcsUtcStamp(new Date()),
      'DTSTART:' + toIcsLocalDateTime(start),
      'DTEND:' + toIcsLocalDateTime(end),
      'SUMMARY:' + escapeIcsText(title),
      'DESCRIPTION:' + escapeIcsText(desc),
      'LOCATION:Zoom',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function downloadIcsFile(booking, durationMins) {
    const ics = buildIcsContent(booking, durationMins);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const fileName =
      'nasq-' +
      (booking.date || 'day') +
      '-' +
      String(booking.time || '00-00').replace(':', '') +
      '.ics';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* —— Admin auth —— */
  function checkAdminPassword(pass, settings) {
    const expected =
      (settings && settings.adminPassword) || DEFAULT_ADMIN_PASS;
    return String(pass || '') === String(expected);
  }

  function isAdminLoggedIn() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION) === '1';
    } catch (e) {
      return false;
    }
  }

  function setAdminLoggedIn(ok) {
    try {
      if (ok) sessionStorage.setItem(ADMIN_SESSION, '1');
      else sessionStorage.removeItem(ADMIN_SESSION);
    } catch (e) {}
  }

  global.NasqCore = {
    SETTINGS_KEY,
    BOOKINGS_KEY,
    PHOTO_BACKGROUNDS,
    DESIGN_MODES,
    DEFAULT_TEXTS,
    DEFAULT_ADMIN_PASS,
    defaultSettings,
    loadSettings,
    saveSettings,
    downloadSettingsFile,
    applySettingsToPage,
    applyPhotoIndex,
    applyDesignMode,
    applyTransparency,
    applyTexts,
    getBookings,
    setBookings,
    saveBooking,
    deleteBooking,
    updateBooking,
    findConflicts,
    isSlotTaken,
    isWithinWorkingHours,
    workingHoursLabel,
    buildIcsContent,
    downloadIcsFile,
    timeToMinutes,
    pad2,
    checkAdminPassword,
    isAdminLoggedIn,
    setAdminLoggedIn,
    getAssetBaseRoot,
    photoBackgroundUrl,
    deepMerge
  };
})(typeof window !== 'undefined' ? window : globalThis);
