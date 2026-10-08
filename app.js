// Keep the normal HTTPS link usable even when JavaScript is disabled.
const watch = document.getElementById('watch');
const webUrl = watch.href;
const isAndroid = /Android/i.test(navigator.userAgent);
const isMobile = isAndroid || /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isAndroid) {
  watch.href = 'intent://www.youtube.com/shorts/cUWyAyXWnHM#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=' + encodeURIComponent(webUrl) + ';end';
  watch.addEventListener('click', () => {
    document.getElementById('app-help').hidden = false;
  });
} else if (!isMobile) {
  watch.target = '_blank';
  watch.rel = 'noopener noreferrer';
}
// iOS uses the original YouTube Universal Link. The host browser controls app handoff.

const purchase = document.getElementById('purchase');
const purchaseDialog = document.getElementById('purchase-dialog');
purchase.addEventListener('click', () => purchaseDialog.showModal());
purchaseDialog.addEventListener('close', () => purchase.focus({ preventScroll: true }));
purchaseDialog.addEventListener('click', (event) => {
  if (event.target !== purchaseDialog) return;
  const rect = purchaseDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) purchaseDialog.close();
});

// Only an explicit pause stops playback while this page is visible.
const gallery = document.querySelector('.visual');
const frontSlides = [...document.querySelectorAll('.front-stage .photo-slide')];
const rearSlides = [...document.querySelectorAll('.rear-stage .photo-slide')];
const photoToggle = document.getElementById('photo-toggle');
const photoNext = document.getElementById('photo-next');
const desktopGallery = matchMedia('(min-width: 768px)');
const captions = ['우리 집에 뽀송이가 떴다!', '일상 속에서 만나는 뽀송이', '냉장고 속 작은 청정 지킴이'];
let photoIndex = 0;
let paused = false;
let photoTimer;
function photoLoaded(slide) {
  const image = slide.querySelector('img');
  return image.complete && image.naturalWidth > 0;
}
function schedulePhoto() {
  clearTimeout(photoTimer);
  if (paused || document.hidden || purchaseDialog.open) return;
  photoTimer = setTimeout(() => { advancePhoto(); schedulePhoto(); }, 5000);
}
function advancePhoto() {
  // Skip unavailable photos without letting one failed image stop the gallery.
  for (let offset = 1; offset < frontSlides.length; offset++) {
    const next = (photoIndex + offset) % frontSlides.length;
    if (photoLoaded(frontSlides[next])) {
      photoIndex = next;
      renderPhoto();
      return;
    }
  }
}
function renderPhoto() {
  let rearIndex = (photoIndex + frontSlides.length - 1) % frontSlides.length;
  for (let offset = 0; offset < rearSlides.length; offset++) {
    const candidate = (rearIndex - offset + rearSlides.length) % rearSlides.length;
    if (photoLoaded(rearSlides[candidate])) { rearIndex = candidate; break; }
  }
  for (const [slides, active] of [[frontSlides, photoIndex], [rearSlides, rearIndex]]) {
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === active);
      slide.setAttribute('aria-hidden', String(index !== active));
    });
  }
  document.getElementById('photo-caption').textContent = captions[photoIndex];
}
function updatePhotoToggle() {
  const label = paused ? '사진 자동 전환 시작' : '사진 자동 전환 일시정지';
  photoToggle.setAttribute('aria-label', label);
  photoToggle.title = label;
  photoToggle.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
}
photoToggle.addEventListener('click', () => { paused = !paused; updatePhotoToggle(); schedulePhoto(); });
photoNext.addEventListener('click', () => { advancePhoto(); schedulePhoto(); });
document.addEventListener('visibilitychange', schedulePhoto);
window.addEventListener('pageshow', schedulePhoto);
purchase.addEventListener('click', schedulePhoto);
purchaseDialog.addEventListener('close', schedulePhoto);
desktopGallery.addEventListener('change', () => {
  photoIndex = 0;
  renderPhoto();
  schedulePhoto();
});
// The initial markup always shows the suit image, including on mobile.
// Do not gate the timer on decoding every image: srcset switches can abort decode().
document.querySelector('.photo-controls').hidden = false;
updatePhotoToggle();
schedulePhoto();
