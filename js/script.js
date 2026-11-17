/**
 * ENSINA AÍ - Instituição de Ensino
 * JavaScript Vanilla (ES6+) - Funcionalidades Essenciais de Navegação, Acessibilidade e Galeria
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initActiveNavSpy();
  initSmoothScrollLinks();
  initGalleryLightbox();
});

/**
 * 1. Efeito visual no Header ao rolar a página
 */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * 2. Menu Responsivo Mobile (Abertura, Fechamento, Foco e Acessibilidade)
 */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navBackdrop = document.getElementById('nav-backdrop');
  const navLinks = document.querySelectorAll('.nav-link, .nav-menu-cta .btn');

  if (!toggleBtn || !navMenu) return;

  const toggleIcon = toggleBtn.querySelector('img');
  const firstNavLink = navMenu.querySelector('.nav-link');

  const openMenu = () => {
    navMenu.classList.add('is-open');
    if (navBackdrop) navBackdrop.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Fechar menu de navegação');
    if (toggleIcon) toggleIcon.src = 'assets/icons/close.svg';
    document.body.style.overflow = 'hidden';

    if (firstNavLink && typeof firstNavLink.focus === 'function') {
      window.setTimeout(() => firstNavLink.focus(), 60);
    }
  };

  const closeMenu = (restoreFocus = false) => {
    navMenu.classList.remove('is-open');
    if (navBackdrop) navBackdrop.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Abrir menu de navegação');
    if (toggleIcon) toggleIcon.src = 'assets/icons/menu.svg';
    document.body.style.overflow = '';

    if (restoreFocus && typeof toggleBtn.focus === 'function') {
      toggleBtn.focus();
    }
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.contains('is-open');
    if (isOpen) {
      closeMenu(false);
    } else {
      openMenu();
    }
  });

  if (navBackdrop) {
    navBackdrop.addEventListener('click', () => closeMenu(true));
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('is-open')) {
        closeMenu(false);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('is-open')) {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeMenu(false);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('is-open')) {
      closeMenu(false);
    }
  });
}

/**
 * 3. Destaque do link ativo na navegação via IntersectionObserver
 */
function initActiveNavSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'location');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

/**
 * 4. Tratamento suave de rolagem e foco acessível no conteúdo principal
 */
function initSmoothScrollLinks() {
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  const header = document.querySelector('.site-header');
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  internalLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#' || !targetId.startsWith('#')) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 80;
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        if (link.classList.contains('skip-to-content')) {
          if (!targetElement.hasAttribute('tabindex')) {
            targetElement.setAttribute('tabindex', '-1');
          }
          targetElement.focus({ preventScroll: true });
          return;
        }

        history.pushState(null, '', targetId);
      }
    });
  });
}

/**
 * 5. Lightbox Modal para Galeria de Infraestrutura (com Focus Trap e WCAG Dialog)
 */
function initGalleryLightbox() {
  const modal = document.getElementById('gallery-lightbox');
  if (!modal) return;

  const modalImg = modal.querySelector('.gallery-modal-img');
  const modalTitle = modal.querySelector('.gallery-modal-title');
  const modalDesc = modal.querySelector('.gallery-modal-desc');
  const closeBtn = modal.querySelector('.gallery-modal-close');

  const galleryItems = document.querySelectorAll('.infra-media-container');
  let lastFocusedElement = null;

  const getFocusableElements = () =>
    Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

  const openLightbox = (imgSrc, altText, titleText, descText, triggerEl) => {
    lastFocusedElement = triggerEl || document.activeElement;
    if (modalImg) {
      modalImg.src = imgSrc;
      modalImg.alt = altText;
    }
    if (modalTitle) modalTitle.textContent = titleText || '';
    if (modalDesc) modalDesc.textContent = descText || '';

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (closeBtn) {
      closeBtn.focus();
    }
  };

  const closeLightbox = () => {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  galleryItems.forEach((container) => {
    container.addEventListener('click', (e) => {
      const img = container.querySelector('img.infra-image');
      const card = container.closest('.infra-card');
      const title = card ? card.querySelector('.infra-title')?.textContent : '';
      const desc = card ? card.querySelector('.infra-desc')?.textContent : '';
      const triggerEl = e.target.closest('button') || container.querySelector('.infra-zoom-btn');

      if (img) {
        openLightbox(img.src, img.alt, title, desc, triggerEl);
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = getFocusableElements();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
