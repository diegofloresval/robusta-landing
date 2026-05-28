// Nav scroll state
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 12) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal on scroll for cards + section heads
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.15 });

document.querySelectorAll('.card').forEach((el, i) => {
  el.style.transitionDelay = (i * 90) + 'ms';
  io.observe(el);
});
document.querySelectorAll('.section-head, .process li, .stage').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

// Form handling
const form = document.getElementById('lead-form');
const success = document.querySelector('.form-success');
const echoEmail = document.querySelector('.echo-email');

function validURL(v) {
  return /(maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(v);
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  // basic validation
  let ok = true;
  for (const k of ['nombre', 'negocio', 'link', 'email']) {
    if (!data[k] || !String(data[k]).trim()) ok = false;
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) ok = false;
  if (!validURL(data.link)) {
    form.querySelector('#link').focus();
    form.querySelector('#link').style.borderBottomColor = 'var(--c-magenta)';
    return;
  }
  if (!ok) return;

  const btn = form.querySelector('.btn-submit');
  btn.classList.add('loading');

  try {
    const res = await fetch('https://formspree.io/f/xeednqra', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('bad');

    echoEmail.textContent = data.email;
    form.style.transition = 'opacity .5s ease, transform .5s ease';
    form.style.opacity = '0';
    form.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      form.hidden = true;
      success.hidden = false;
      success.style.opacity = '0';
      requestAnimationFrame(() => {
        success.style.transition = 'opacity .6s ease';
        success.style.opacity = '1';
      });
      // GA4 conversion event
      if (window.gtag) window.gtag('event', 'generate_lead', { value: 1 });
    }, 500);
  } catch (e) {
    btn.classList.remove('loading');
    alert('No pudimos enviar tu solicitud. Probá de nuevo en unos segundos.');
  }
});
