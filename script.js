document.getElementById('year').textContent = new Date().getFullYear();

/* Mobile nav toggle */
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
navToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* Reduced motion check */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Hero node graph (deterministic pseudo-random) ===== */
(function buildGraph() {
  const svg = document.getElementById('heroGraph');
  if (!svg) return;
  const W = 1200, H = 700;
  let seed = 42;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const nodes = [];
  const count = 28;
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: rand() * W,
      y: rand() * H,
      r: 2 + rand() * 3,
      dim: rand() > 0.7
    });
  }

  const ns = 'http://www.w3.org/2000/svg';
  const linkGroup = document.createElementNS(ns, 'g');
  const nodeGroup = document.createElementNS(ns, 'g');

  /* connect each node to its nearest 1-2 neighbors */
  nodes.forEach((n, i) => {
    const distances = nodes
      .map((m, j) => ({ j, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter(o => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    distances.forEach(o => {
      if (o.d < 260) {
        const m = nodes[o.j];
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', n.x);
        line.setAttribute('y1', n.y);
        line.setAttribute('x2', m.x);
        line.setAttribute('y2', m.y);
        line.setAttribute('class', 'g-link');
        linkGroup.appendChild(line);
      }
    });
  });

  nodes.forEach((n, i) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', n.x);
    c.setAttribute('cy', n.y);
    c.setAttribute('r', n.r);
    c.setAttribute('class', 'g-node' + (n.dim ? ' dim' : ''));
    if (!prefersReducedMotion) {
      c.style.animation = `gdrift ${8 + (i % 5)}s ease-in-out ${(i % 7) * 0.4}s infinite`;
    }
    nodeGroup.appendChild(c);
  });

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(linkGroup);
  svg.appendChild(nodeGroup);

  if (!prefersReducedMotion) {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes gdrift {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(0, -6px); }
      }
    `;
    document.head.appendChild(styleEl);
  }
})();

/* ===== Scroll reveal ===== */
const revealEls = document.querySelectorAll('.phil-card, .impact-card, .case-card, .foundation-row, .writing-row, .contact-link');
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

/* ===== Timeline progress + node activation ===== */
const tlItems = document.querySelectorAll('.tl-item');
const trackFill = document.querySelector('.timeline-track-fill');

const tlObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
  updateTrackFill();
}, { threshold: 0.4 });

tlItems.forEach(item => tlObserver.observe(item));

function updateTrackFill() {
  const activeItems = document.querySelectorAll('.tl-item.in-view');
  if (activeItems.length === 0) { trackFill.style.height = '0%'; return; }
  const last = activeItems[activeItems.length - 1];
  const timeline = document.getElementById('timeline');
  const timelineRect = timeline.getBoundingClientRect();
  const lastRect = last.querySelector('.tl-node').getBoundingClientRect();
  const pct = ((lastRect.top - timelineRect.top + 10) / timeline.offsetHeight) * 100;
  trackFill.style.height = Math.min(100, Math.max(0, pct)) + '%';
}
