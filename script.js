/* ── Theme toggle ── */
const tbtn = document.getElementById('tbtn');
const root = document.documentElement;
let dark = true;
tbtn.addEventListener('click', () => {
  dark = !dark;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  tbtn.textContent = dark ? '🌙' : '☀️';
});

/* ── Cursor glow (pointer devices only) ── */
const cg = document.getElementById('cglow');
if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cg.style.opacity = '1';
    cg.style.left = e.clientX + 'px';
    cg.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', () => cg.style.opacity = '0');
}

/* ── Scroll-reveal exp cards ── */
const io = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('vis'), i * 110);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.ecard').forEach(el => io.observe(el));

/* ── Active nav highlight ── */
const secs = document.querySelectorAll('section[id]');
const nls  = document.querySelectorAll('.navpill a');
const nio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      nls.forEach(a => a.classList.remove('on'));
      const a = document.querySelector(`.navpill a[href="#${e.target.id}"]`);
      if (a) a.classList.add('on');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
secs.forEach(s => nio.observe(s));
