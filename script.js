(() => {
  // ===== CONFIG =====
  const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/XZDP2BFGCC';

  // ===== UTILS =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header
  const header = document.getElementById('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Burger
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  // Phone mask
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  // ===== FORM SUBMIT -> CLOUDFLARE WORKER -> TELEGRAM =====
  const form = document.getElementById('leadForm');
  const status = document.getElementById('formStatus');
  const say = (msg) => { if (status) status.textContent = msg; };

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;

    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });

    if (payload._gotcha) return;

    const digits = (payload.phone || '').replace(/\D/g, '');
    if (!payload.name || digits.length < 11) {
      say('Укажите имя и телефон полностью, чтобы мы могли связаться.');
      return;
    }
    delete payload.consent;

    btn.disabled = true;
    btn.textContent = 'Отправляем...';
    say('');

    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      say('Спасибо! Свяжемся с вами в ближайшее время, чтобы согласовать время диагностики.');
      form.reset();
      if (typeof ym === 'function' && window.YM_ID) ym(window.YM_ID, 'reachGoal', 'lead_form');
      if (typeof gtag === 'function') gtag('event', 'generate_lead');
    } catch (err) {
      console.error(err);
      btn.textContent = 'Не отправилось';
      say('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.');
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    }
  });

  // Smooth scroll with header offset
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
