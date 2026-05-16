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
    '20” Aero Silver': { price: 0, style: 'radial-gradient(circle,#1b202a 40%,#9ca4b2 41%,#222838 65%)' },
    '21” Carbon Blade': { price: 4500, style: 'radial-gradient(circle,#111 40%,#6b7280 41%,#1a1d26 65%)' },
    '22” Forged Black': { price: 7500, style: 'radial-gradient(circle,#050505 40%,#404652 41%,#12151b 65%)' }
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

const defaults = { color: 'Obsidian Black', wheels: '20” Aero Silver', ambient: 'Ice Blue', mode: 'Comfort' };
let config = { ...defaults };

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

function renderOptions() {
  const colorWrap = qs('#colorOptions');
  const wheelWrap = qs('#wheelOptions');
  const ambientWrap = qs('#ambientOptions');
  const modeWrap = qs('#modeOptions');

  Object.entries(options.colors).forEach(([name, val]) => {
    const b = document.createElement('button');
    b.className = 'color-btn';
    b.style.background = val.hex;
    b.dataset.type = 'color'; b.dataset.value = name; b.title = name; b.setAttribute('aria-label', name);
    colorWrap.appendChild(b);
  });

  const chipBuilder = (wrap, type, data) => {
    Object.keys(data).forEach((name) => {
      const b = document.createElement('button');
      b.className = 'chip'; b.dataset.type = type; b.dataset.value = name; b.textContent = name;
      wrap.appendChild(b);
    });
  };
  chipBuilder(wheelWrap, 'wheels', options.wheels);
  chipBuilder(ambientWrap, 'ambient', options.ambient);
  chipBuilder(modeWrap, 'mode', options.modes);
}

function applyConfig() {
  const color = options.colors[config.color];
  const wheel = options.wheels[config.wheels];
  const ambient = options.ambient[config.ambient];
  const mode = options.modes[config.mode];

  const carClass = `car-color-${slug(config.color)}`;
  const wheelClass = `wheel-${slug(config.wheels.replace(/20|21|22/g, '').replace(/”/g, ''))}`;
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

  const price = basePrice + color.price + wheel.price + ambient.price;
  qs('#sumPrice').textContent = formatPrice(price);

  qsa('[data-type]').forEach((el) => {
    const isActive = config[el.dataset.type] === el.dataset.value;
    el.classList.toggle('active', isActive);
  });
}

function saveConfig() { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); toast('Configuration saved'); }
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    config = { ...defaults, ...parsed };
  } catch { config = { ...defaults }; }
}
function resetConfig() {
  config = { ...defaults };
  localStorage.removeItem(STORAGE_KEY);
  applyConfig();
  toast('Configuration reset');
}

function bindUI() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (btn) { config[btn.dataset.type] = btn.dataset.value; applyConfig(); }
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
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const header = qs('.header');
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    if (!window.matchMedia('(max-width: 900px)').matches) {
      const y = Math.min(window.scrollY * 0.08, 34);
      qs('#heroCar').style.transform = `translateY(${y}px) translateX(${Math.sin(window.scrollY * 0.01) * 12}px)`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

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
