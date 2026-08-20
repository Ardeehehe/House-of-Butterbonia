if (location.pathname.split('/').pop() !== 'loading.html' && sessionStorage.getItem('butterboniaAccess') !== 'granted') {
  location.replace('loading.html');
}

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
reveals.forEach(element => observer.observe(element));

document.querySelectorAll('.stat strong, .profile-stat strong').forEach(element => {
  const match = element.textContent.trim().match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = Number(match[1]);
  const suffix = match[2];
  const start = performance.now();
  const duration = 1100;
  const tick = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${String(Math.round(target * eased)).padStart(match[1].length, '0')}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const pageVisuals = {
  'about.html': [
    ['legal', '§', 'PROFILE / 01'],
    ['accounting', '₱', 'PROFILE / 02'],
    ['analysis', '↗', 'PROFILE / 03'],
    ['entrepreneur', '✦', 'PROFILE / 04'],
    ['accounting', '₱', 'PROFILE / 05'],
    ['security', '⌁', 'PROFILE / 06']
  ],
  'careers.html': [
    ['accounting', '₱', 'LEDGER / 01'],
    ['analysis', '↗', 'INSIGHT / 02'],
    ['legal', '§', 'POLICY / 03'],
    ['entrepreneur', '✦', 'VENTURE / 04'],
    ['security', '⌁', 'DEFENSE / 05'],
    ['accounting', '₱', 'NUMBERS / 01'],
    ['legal', '§', 'BUSINESS / 02'],
    ['accounting', '₱', 'FINANCE / 03'],
    ['entrepreneur', '✦', 'IMPACT / 04']
  ],
  'skills.html': [
    ['accounting', '₱', 'PRECISION / 01'],
    ['legal', '◎', 'CONNECTION / 02'],
    ['analysis', '↗', 'STRATEGY / 03'],
    ['security', '⌁', 'LEADERSHIP / 04']
  ],
  'resources.html': [
    ['analysis', '◎', 'LEARN / 01'],
    ['entrepreneur', '✦', 'PRACTICE / 02'],
    ['legal', '◌', 'CONNECT / 03'],
    ['security', '⌁', 'EXPERIENCE / 04']
  ]
};

const currentPage = location.pathname.split('/').pop();

const secretNav = document.querySelector('nav');
if (secretNav && !secretNav.querySelector('.secret-game-trigger')) {
  const secretTrigger = document.createElement('a');
  secretTrigger.className = 'secret-game-trigger';
  secretTrigger.href = 'game.html';
  secretTrigger.setAttribute('aria-label', 'Restricted signal');
  secretTrigger.title = 'Restricted signal';
  secretTrigger.textContent = '◈';
  secretNav.append(secretTrigger);
}

const swipePages = ['index.html', 'about.html', 'careers.html', 'skills.html', 'resources.html'];
const pageLabels = {
  'about.html': 'Career Paths',
  'careers.html': 'Skills',
  'skills.html': 'Resources',
  'resources.html': 'Home'
};

const pageIndex = swipePages.indexOf(currentPage || 'index.html');
const nextPage = swipePages[(pageIndex + 1) % swipePages.length];
const footer = document.querySelector('footer');
if (footer && nextPage) {
  const nextNavigation = document.createElement('div');
  nextNavigation.className = 'page-next wrap';
  nextNavigation.innerHTML = `<span class="eyebrow">Continue exploring</span><a class="page-next-link" href="${nextPage}">Next: ${pageLabels[currentPage] || 'About the Team'} <span aria-hidden="true">↗</span></a>`;
  footer.before(nextNavigation);
}

const nextNavigationStyles = document.createElement('style');
nextNavigationStyles.textContent = '.page-next{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:34px 0;border-top:1px solid var(--line,rgba(255,255,255,.12));}.page-next-link{color:var(--white,#f5f2ef);font:600 clamp(22px,3vw,42px) "Space Grotesk",sans-serif;letter-spacing:-.04em;transition:color .3s ease,transform .3s ease;}.page-next-link span{color:var(--red,#ff183f);}.page-next-link:hover{color:var(--red,#ff183f);transform:translateX(6px);}.secret-game-trigger{position:fixed;right:18px;bottom:16px;z-index:45;color:var(--red,#ff183f);font:16px "Space Grotesk",sans-serif;opacity:.13;transition:opacity .3s ease,transform .3s ease;text-shadow:0 0 14px var(--red,#ff183f);}.secret-game-trigger:hover,.secret-game-trigger:focus-visible{opacity:1;transform:rotate(20deg) scale(1.2);outline:0;}@media(max-width:600px){.page-next{align-items:flex-start;flex-direction:column;gap:12px;}.page-next-link{font-size:28px;}}';
document.head.append(nextNavigationStyles);

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', event => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

document.addEventListener('touchend', event => {
  const touch = event.changedTouches[0];
  const horizontalDistance = touchStartX - touch.clientX;
  const verticalDistance = Math.abs(touchStartY - touch.clientY);
  if (horizontalDistance < 70 || horizontalDistance < verticalDistance) return;

  const pageName = currentPage || 'index.html';
  const nextPage = swipePages[swipePages.indexOf(pageName) + 1];
  if (nextPage) location.href = nextPage;
}, { passive: true });

const visuals = pageVisuals[currentPage];
if (visuals) {
  document.querySelectorAll('.cards .card').forEach((card, index) => {
    const visual = visuals[index];
    if (!visual) return;
    const marker = document.createElement('div');
    marker.className = `track-visual ${visual[0]}`;
    marker.innerHTML = `<strong>${visual[1]}</strong><small>${visual[2]}</small>`;
    card.prepend(marker);
  });
}

const profileData = {
  'marvin.html': { symbol: '§', code: 'BSLM / 01', stats: [['TRACK', 'BSLM'], ['FOCUS', 'COMPLIANCE'], ['SIGNAL', 'LEADERSHIP']] },
  'rene.html': { symbol: '₱', code: 'CPA / 02', stats: [['TRACK', 'ACCOUNTING'], ['FOCUS', 'FINANCE'], ['SIGNAL', 'STABILITY']] },
  'gillian.html': { symbol: '↗', code: 'MARKET / 03', stats: [['TRACK', 'ANALYSIS'], ['FOCUS', 'BUSINESS'], ['SIGNAL', 'INSIGHT']] },
  'robmel.html': { symbol: '✦', code: 'VENTURE / 04', stats: [['TRACK', 'ENTREPRENEUR'], ['FOCUS', 'INNOVATION'], ['SIGNAL', 'IMPACT']] },
  'acer.html': { symbol: '₱', code: 'CPA / 05', stats: [['TRACK', 'ACCOUNTING'], ['FOCUS', 'WEALTH'], ['SIGNAL', 'PRECISION']] },
  'ardee.html': { symbol: '⌁', code: 'INFO / 06', stats: [['TRACK', 'INFOSECURITY'], ['FOCUS', 'FORENSICS'], ['SIGNAL', 'DEFENSE']] },
};

const profile = profileData[currentPage];
if (profile) {
  const contentGrid = document.querySelector('main .content-grid');
  if (contentGrid) {
    const stage = document.createElement('div');
    stage.className = 'profile-stage';
    stage.innerHTML = `<div class="hologram"><div class="hologram-grid"></div><div class="hologram-label">HOLOGRAM / ${profile.code}</div><strong class="hologram-symbol">${profile.symbol}</strong><button class="hologram-toggle" type="button">Activate signal</button></div><div class="profile-stats">${profile.stats.map((stat, index) => `<div class="profile-stat"><strong class="${index === 1 ? 'accent' : ''}">${stat[1]}</strong><span>${stat[0]}</span></div>`).join('')}</div>`;
    contentGrid.parentElement.insertBefore(stage, contentGrid);
    const hologram = stage.querySelector('.hologram');
    const toggle = stage.querySelector('.hologram-toggle');
    toggle.addEventListener('click', () => {
      const active = hologram.classList.toggle('is-active');
      toggle.textContent = active ? 'Deactivate signal' : 'Activate signal';
    });
  }
}
