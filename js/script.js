const STORAGE_KEY = 'aurora-config-v1';
const basePrice = 189000;

const options = {
  colors: {
    'Obsidian Black': { hex: '#111111', price: 0 },
    'Arctic White': { hex: '#d9dde4', price: 1500 },
    'Crimson Red': { hex: '#8a1b24', price: 3000 },
    'Liquid Silver': { hex: '#9ca4b2', price: 2000 },
    'Midnight Blue': { hex: '#1e2d52', price: 2500 }
  },
  wheels: {
    '20" Aero Silver': { price: 0, style: 'radial-gradient(circle,#080a0f 0 18%,#dce3ec 19% 27%,#384150 28% 42%,#07090d 43% 55%,#9ca4b2 56% 62%,#1b202a 63% 100%)' },
    '21" Carbon Blade': { price: 4500, style: 'conic-gradient(from 23deg,#20242c 0 18deg,transparent 19deg 43deg,#a7afbc 44deg 55deg,transparent 56deg 91deg,#20242c 92deg 111deg,transparent 112deg 137deg,#a7afbc 138deg 150deg,transparent 151deg 185deg,#20242c 186deg 205deg,transparent 206deg 231deg,#a7afbc 232deg 244deg,transparent 245deg 280deg,#20242c 281deg 299deg,transparent 300deg 325deg,#a7afbc 326deg 338deg,transparent 339deg 360deg),radial-gradient(circle,#07080b 0 44%,#6b7280 45% 55%,#111 56% 100%)' },
    '22" Forged Black': { price: 7500, style: 'conic-gradient(from 0deg,#050608 0 12deg,#5b6472 13deg 22deg,transparent 23deg 45deg,#050608 46deg 58deg,#5b6472 59deg 68deg,transparent 69deg 91deg,#050608 92deg 104deg,#5b6472 105deg 114deg,transparent 115deg 137deg,#050608 138deg 150deg,#5b6472 151deg 160deg,transparent 161deg 183deg,#050608 184deg 196deg,#5b6472 197deg 206deg,transparent 207deg 229deg,#050608 230deg 242deg,#5b6472 243deg 252deg,transparent 253deg 275deg,#050608 276deg 288deg,#5b6472 289deg 298deg,transparent 299deg 321deg,#050608 322deg 334deg,#5b6472 335deg 344deg,transparent 345deg 360deg),radial-gradient(circle,#050505 0 44%,#404652 45% 55%,#12151b 56% 100%)' }
  },
  ambient: {
    'Ice Blue': { color: '#7cc9ff', price: 0 },
    'Warm Gold': { color: '#f3c66f', price: 800 },
    'Crimson Pulse': { color: '#d9304f', price: 1000 },
    'Violet Night': { color: '#8e7cff', price: 1200 },
    'Emerald Line': { color: '#4acf9b', price: 1100 }
  },
  modes: {
    Comfort: { power: '620 hp', acceleration: '4.1s', range: '720 km' },
    Sport: { power: '760 hp', acceleration: '3.3s', range: '650 km' },
    Track: { power: '890 hp', acceleration: '2.8s', range: '540 km' },
    Silent: { power: '480 hp', acceleration: '5.6s', range: '790 km' }
  }
};

const legacyWheels = {
  '20\\u0432\\u0402\\u045c Aero Silver': '20" Aero Silver',
  '21\\u0432\\u0402\\u045c Carbon Blade': '21" Carbon Blade',
  '22\\u0432\\u0402\\u045c Forged Black': '22" Forged Black',
  '20\\u201d Aero Silver': '20" Aero Silver',
  '21\\u201d Carbon Blade': '21" Carbon Blade',
  '22\\u201d Forged Black': '22" Forged Black'
};

const defaults = { color: 'Obsidian Black', wheels: '20" Aero Silver', ambient: 'Ice Blue', mode: 'Comfort' };
let config = { ...defaults };
let displayedPrice = basePrice;
let priceFrame = null;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileParallaxQuery = window.matchMedia('(max-width: 900px)');

const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function formatPrice(v) { return `$${v.toLocaleString('en-US')}`; }
function toast(msg) {
  const el = qs('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function legacyWheelName(name) {
  if (!name) return defaults.wheels;
  const escaped = [...name].map((char) => {
    const code = char.charCodeAt(0);
    return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
  }).join('');
  return legacyWheels[escaped] || name;
}

function renderOptions() {
  const colorWrap = qs('#colorOptions');
  const wheelWrap = qs('#wheelOptions');
  const ambientWrap = qs('#ambientOptions');
  const modeWrap = qs('#modeOptions');

  Object.entries(options.colors).forEach(([name, val]) => {
    const b = document.createElement('button');
    b.className = 'color-btn';
    b.style.setProperty('--swatch', val.hex);
    b.dataset.type = 'color';
    b.dataset.value = name;
    b.title = name;
    b.setAttribute('aria-label', name);
    colorWrap.appendChild(b);
  });

  Object.entries(options.wheels).forEach(([name, val]) => {
    const b = document.createElement('button');
    b.className = 'wheel-card';
    b.dataset.type = 'wheels';
    b.dataset.value = name;
    b.setAttribute('aria-label', name);
    b.innerHTML = `<span class="wheel-preview" aria-hidden="true"></span><span>${name}</span>`;
    b.querySelector('.wheel-preview').style.setProperty('--wheel-preview', val.style);
    wheelWrap.appendChild(b);
  });

  Object.entries(options.ambient).forEach(([name, val]) => {
    const b = document.createElement('button');
    b.className = 'ambient-pill';
    b.dataset.type = 'ambient';
    b.dataset.value = name;
    b.style.setProperty('--ambient', val.color);
    b.textContent = name;
    ambientWrap.appendChild(b);
  });

  Object.keys(options.modes).forEach((name) => {
    const b = document.createElement('button');
    b.className = 'mode-segment';
    b.dataset.type = 'mode';
    b.dataset.value = name;
    b.textContent = name;
    modeWrap.appendChild(b);
  });
}

function normalizeConfig(value = {}) {
  const wheelName = legacyWheelName(value.wheels);
  return {
    ...defaults,
    ...value,
    color: options.colors[value.color] ? value.color : defaults.color,
    wheels: options.wheels[wheelName] ? wheelName : defaults.wheels,
    ambient: options.ambient[value.ambient] ? value.ambient : defaults.ambient,
    mode: options.modes[value.mode] ? value.mode : defaults.mode
  };
}

function pulseConfig() {
  [qs('#configCar'), qs('#summary')].forEach((el) => {
    el.classList.remove('config-pulse');
    void el.offsetWidth;
    el.classList.add('config-pulse');
  });
}

function pulsePaint() {
  qsa('.car-visual').forEach((el) => {
    el.classList.remove('paint-changing');
    void el.offsetWidth;
    el.classList.add('paint-changing');
  });
}

function pulseModeStats() {
  ['#sumPower', '#sumAcceleration', '#sumRange'].forEach((selector) => {
    const el = qs(selector);
    el.classList.remove('stat-changing');
    void el.offsetWidth;
    el.classList.add('stat-changing');
  });
}

function animatePrice(nextPrice) {
  const el = qs('#sumPrice');
  const startPrice = displayedPrice || nextPrice;
  const start = performance.now();
  const duration = 420;

  if (priceFrame) cancelAnimationFrame(priceFrame);

  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const current = Math.round(startPrice + (nextPrice - startPrice) * eased);
    el.textContent = formatPrice(current);
    if (p < 1) {
      priceFrame = requestAnimationFrame(step);
    } else {
      displayedPrice = nextPrice;
      priceFrame = null;
    }
  };

  priceFrame = requestAnimationFrame(step);
}

function applyConfig() {
  config = normalizeConfig(config);

  const color = options.colors[config.color] || options.colors[defaults.color];
  const wheel = options.wheels[config.wheels] || options.wheels[defaults.wheels];
  const ambient = options.ambient[config.ambient] || options.ambient[defaults.ambient];
  const mode = options.modes[config.mode] || options.modes[defaults.mode];

  const carClass = `car-color-${slug(config.color)}`;
  const wheelClass = `wheel-${slug(config.wheels.replace(/20|21|22|"/g, ''))}`;
  qsa('.car-visual').forEach((carEl) => {
    carEl.classList.remove(
      'car-color-obsidian-black',
      'car-color-arctic-white',
      'car-color-crimson-red',
      'car-color-liquid-silver',
      'car-color-midnight-blue',
      'wheel-aero-silver',
      'wheel-carbon-blade',
      'wheel-forged-black'
    );
    carEl.classList.add(carClass, wheelClass);
    carEl.style.setProperty('--selected-paint', color.hex);
  });
  qs('#ambientStrip').style.background = ambient.color;
  qs('#ambientStrip').style.boxShadow = `0 0 26px ${ambient.color}`;

  qs('#sumColor').textContent = config.color;
  qs('#sumWheels').textContent = config.wheels;
  qs('#sumAmbient').textContent = config.ambient;
  qs('#sumMode').textContent = config.mode;
  qs('#sumPower').textContent = mode.power;
  qs('#sumAcceleration').textContent = mode.acceleration;
  qs('#sumRange').textContent = mode.range;
  ['#sumPower', '#sumAcceleration', '#sumRange'].forEach((selector) => qs(selector).classList.add('mode-stat'));
  qs('#stageMode').textContent = config.mode;

  const price = basePrice + color.price + wheel.price + ambient.price;
  animatePrice(price);

  qsa('[data-type]').forEach((el) => {
    const isActive = config[el.dataset.type] === el.dataset.value;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-pressed', String(isActive));
  });
}

function saveConfig() { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); toast('Configuration saved'); }
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    config = normalizeConfig(parsed);
  } catch { config = { ...defaults }; }
}
function resetConfig() {
  config = { ...defaults };
  localStorage.removeItem(STORAGE_KEY);
  applyConfig();
  pulseConfig();
  toast('Configuration reset');
}

function initHeroCascade() {
  if (motionQuery.matches) {
    qsa('.hero-sequence').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      qsa('.hero-sequence').forEach((el) => el.classList.add('is-visible'));
    });
  });
}

function initSectionReveal() {
  const sections = qsa('main > .section:not(.hero)');

  if (motionQuery.matches || !('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('is-visible'));
    return;
  }

  sections.forEach((section) => section.classList.add('section-reveal'));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  sections.forEach((section) => revealObserver.observe(section));
}

function initHeroParallax() {
  const hero = qs('.hero');
  const carWrap = qs('.hero-car-wrap');
  if (!hero || !carWrap || motionQuery.matches || mobileParallaxQuery.matches) return;

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;
  let currentX = 0;
  let currentY = 0;
  let ticking = false;

  const render = () => {
    const rect = hero.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
    const targetX = mouseX * 10;
    const targetY = progress * 18 + mouseY * 7 + scrollY * 0.012;

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    carWrap.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    ticking = false;
  };

  const requestRender = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  };

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5);
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5);
    requestRender();
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    mouseX = 0;
    mouseY = 0;
    requestRender();
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    requestRender();
  }, { passive: true });

  requestRender();
}

function bindUI() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (btn) {
      const changed = config[btn.dataset.type] !== btn.dataset.value;
      const type = btn.dataset.type;
      config[btn.dataset.type] = btn.dataset.value;
      applyConfig();
      if (changed) {
        pulseConfig();
        if (type === 'color') pulsePaint();
        if (type === 'mode') pulseModeStats();
      }
    }
  });

  qs('#saveConfig').addEventListener('click', saveConfig);
  qs('#resetConfig').addEventListener('click', resetConfig);
  qs('#brochureBtn').addEventListener('click', () => toast('Brochure download will be available soon'));

  const audio = new Audio('assets/audio/engine.mp3');
  qs('#playSound').addEventListener('click', async () => {
    try { await audio.play(); } catch { toast('Engine sound file is missing'); }
  });
  qs('#stopSound').addEventListener('click', () => { audio.pause(); audio.currentTime = 0; });
  audio.addEventListener('error', () => toast('Engine sound file is missing'));

  const modal = qs('#lightbox');
  const modalTitle = qs('#modalTitle');
  const modalImage = qs('#modalImage');
  qsa('.gallery-item').forEach((item) => item.addEventListener('click', () => {
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    modalTitle.textContent = item.dataset.title; modalImage.className = `modal-image ${item.classList[1]}`;
  }));
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  qs('#closeModal').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  const burger = qs('#burger');
  const nav = qs('.nav');
  burger.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(opened));
  });
  qsa('.nav a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

  qsa('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = qs(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: motionQuery.matches ? 'auto' : 'smooth', block: 'start' });
  }));

  const header = qs('.header');
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  const perf = qs('#performance');
  const countEls = qsa('.count');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countEls.forEach((el) => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const dur = 1200;
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const v = target % 1 ? (target * p).toFixed(1) : Math.round(target * p);
          el.textContent = `${v}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      obs.unobserve(perf);
    });
  }, { threshold: 0.35 });
  io.observe(perf);
}

renderOptions();
loadConfig();
applyConfig();
bindUI();
initHeroCascade();
initSectionReveal();
initHeroParallax();
