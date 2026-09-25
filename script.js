(() => {
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];

  // Lucide icons, official library. Site remains usable if CDN is unavailable.
  const bootIcons = () => {
    if (!window.lucide?.createIcons) return;
    window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 } });
    $$('a svg, button svg').forEach(svg => svg.classList.add('interactive-icon'));
  };
  bootIcons();

  $('#year').textContent = new Date().getFullYear();

  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 28);
  onScroll();
  addEventListener('scroll', onScroll, { passive:true });

  // Mobile menu with hard body lock and a dedicated close button.
  const menu = $('#mobile-menu');
  const openBtn = $('.menu-toggle');
  const closeBtn = $('.menu-close');
  let menuScrollY = 0;
  function setMenu(open){
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    if(open){
      menuScrollY = window.scrollY;
      document.documentElement.classList.add('menu-open');
      document.body.classList.add('menu-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${menuScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      menu.scrollTop = 0;
    } else {
      document.documentElement.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo({ top: menuScrollY, left: 0, behavior: 'instant' });
    }
  }
  openBtn.addEventListener('click', () => setMenu(true));
  closeBtn.addEventListener('click', () => setMenu(false));
  $$('#mobile-menu a[href^="#"]').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if(e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  menu.addEventListener('touchmove', e => e.preventDefault(), { passive:false });


  // Reveals
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold:.12, rootMargin:'0px 0px -5% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  // Carrosséis: o touch usa o scroll NATIVO do navegador, igual ao site da Peixaria.
  // Nada de JS brigando com o dedo no celular. No desktop, o mouse ganha drag manual.
  $$('[data-carousel]').forEach(carousel => {
    const cards = [...carousel.children];
    const dotsWrap = document.querySelector(`[data-dots-for="${carousel.id}"]`);
    const prev = document.querySelector(`[data-carousel-prev="${carousel.id}"]`);
    const next = document.querySelector(`[data-carousel-next="${carousel.id}"]`);

    if(!cards.length) return;

    // Drag manual somente em mouse/caneta. Em touch deixamos momentum + snap do browser.
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    carousel.addEventListener('pointerdown', e => {
      if(e.pointerType === 'touch') return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = carousel.scrollLeft;
      carousel.classList.add('dragging');
      carousel.setPointerCapture?.(e.pointerId);
    });

    carousel.addEventListener('pointermove', e => {
      if(!down) return;
      const dx = e.clientX - startX;
      if(Math.abs(dx) > 4) moved = true;
      carousel.scrollLeft = startLeft - dx;
    });

    const stopDrag = () => {
      down = false;
      carousel.classList.remove('dragging');
    };
    carousel.addEventListener('pointerup', stopDrag);
    carousel.addEventListener('pointercancel', stopDrag);
    carousel.addEventListener('lostpointercapture', stopDrag);
    carousel.addEventListener('click', e => {
      if(moved){
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    }, true);

    const activeIndex = () => {
      let best = 0;
      let bestD = Infinity;
      cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft - carousel.scrollLeft);
        if(d < bestD){
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    const go = (i, behavior='smooth') => {
      const target = Math.max(0, Math.min(cards.length - 1, i));
      carousel.scrollTo({ left: cards[target].offsetLeft, behavior });
    };

    if(dotsWrap){
      dotsWrap.replaceChildren();
      cards.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Ir para item ${i + 1}`);
        b.addEventListener('click', () => go(i));
        dotsWrap.appendChild(b);
      });
    }

    const update = () => {
      const idx = activeIndex();
      if(dotsWrap){
        [...dotsWrap.children].forEach((dot, i) => dot.classList.toggle('active', i === idx));
      }
    };

    let raf = 0;
    carousel.addEventListener('scroll', () => {
      if(raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    }, { passive:true });

    prev?.addEventListener('click', () => go(activeIndex() - 1));
    next?.addEventListener('click', () => go(activeIndex() + 1));
    carousel.addEventListener('keydown', e => {
      if(e.key === 'ArrowRight'){ e.preventDefault(); go(activeIndex() + 1); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); go(activeIndex() - 1); }
    });

    update();
  });

  // Subtle 3D tilt only on precise pointers. No nausea machine on phones.
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1100px) rotateX(${-y*3.5}deg) rotateY(${x*4.5}deg) translateZ(0)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform='');
    });
  }

  // Gentle hero parallax, capped so it never creates page overflow.
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const heroImg = $('.hero-media img');
    addEventListener('scroll', () => {
      if(window.scrollY < innerHeight * 1.2) heroImg.style.transform = `scale(1.03) translateY(${Math.min(window.scrollY*.08,55)}px)`;
    }, {passive:true});
  }
})();
