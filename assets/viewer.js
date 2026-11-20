// Pictures open over the page at full size, with their caption, a close button and arrows to step through the page's other
// pictures. Esc, Close or a click outside the picture leaves it. Without this script, a picture that's a link still opens
// the file itself.
(() => {
  const pictures = [...document.querySelectorAll('main .gallery img, main figure.shot img')];
  if (!pictures.length || typeof HTMLDialogElement !== 'function') return;

  const icon = path => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-label', 'Picture');
  viewer.innerHTML =
    `<button type="button" class="viewer-close" aria-label="Close">${icon('M6 6l12 12M18 6 6 18')}</button>` +
    `<button type="button" class="viewer-step viewer-prev" aria-label="Previous picture">${icon('m14.5 6-6 6 6 6')}</button>` +
    `<figure><img alt=""><figcaption></figcaption></figure>` +
    `<button type="button" class="viewer-step viewer-next" aria-label="Next picture">${icon('m9.5 6 6 6-6 6')}</button>`;
  document.body.append(viewer);

  const image = viewer.querySelector('img');
  const caption = viewer.querySelector('figcaption');
  const [prev, next] = viewer.querySelectorAll('.viewer-step');
  const several = pictures.length > 1;
  prev.hidden = next.hidden = !several;
  let at = 0;
  let opener = null;

  const source = img => img.closest('a')?.getAttribute('href') || img.getAttribute('src');
  function show(i) {
    at = (i + pictures.length) % pictures.length;
    const img = pictures[at];
    image.src = source(img);
    image.alt = img.alt;
    image.setAttribute('width', img.getAttribute('width') || '');
    image.setAttribute('height', img.getAttribute('height') || '');
    image.className = img.matches('.phone, .gallery.tall img') ? 'tall' : '';
    const text = img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || img.alt;
    caption.textContent = several ? `${text} (${at + 1} of ${pictures.length})` : text;
  }
  function open(i, from) {
    opener = from;
    show(i);
    viewer.showModal();
  }

  pictures.forEach((img, i) => {
    const link = img.closest('a');
    const target = link || img;
    if (!link) {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Enlarge: ${img.alt}`);
    }
    target.classList.add('zoom');
    target.addEventListener('click', e => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(i, target);
    });
    if (!link) target.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, target); }
    });
  });

  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  prev.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  // A click on the dark area around the picture closes it; a click on the picture or its caption doesn't.
  viewer.addEventListener('click', e => { if (e.target === viewer || e.target.tagName === 'FIGURE') viewer.close(); });
  viewer.addEventListener('keydown', e => {
    if (!several) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
  });
  let touchX = null;
  viewer.addEventListener('touchstart', e => { touchX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  viewer.addEventListener('touchend', e => {
    if (touchX === null || !several) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
  });
  viewer.addEventListener('close', () => {
    image.removeAttribute('src');
    opener?.focus();
  });
})();
