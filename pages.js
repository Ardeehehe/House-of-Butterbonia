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
