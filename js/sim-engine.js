/**
 * Martindale VLab - Shared Simulation Engine
 *
 * Handles:
 *   - Sequential click-to-advance frame animation
 *   - Next/Prev step navigation
 *   - Keyboard navigation (Arrow keys, Space, Escape)
 *   - Slide counter and observation log
 *   - Accessibility (ARIA labels, keyboard focus)
 */

(function () {
  'use strict';

  /* ── SimStep class ─────────────────────────────────────── */

  class SimStep {
    /**
     * @param {Object} opts
     * @param {string} opts.container  - CSS selector of the image wrapper
     * @param {string} [opts.prevPage]  - href for "Previous step" button
     * @param {string} [opts.nextPage]  - href for "Next step" button
     */
    constructor(opt) {
      this.container = document.querySelector(opt.container);
      if (!this.container) throw new Error(`SimStep: "${opt.container}" not found`);

      // Collect all <img> children in DOM order
      this.images = Array.from(this.container.querySelectorAll('img'));
      this.current = 0;
      this.total = this.images.length;

      // Navigation pages
      this.prevPage = opt.prevPage || null;
      this.nextPage = opt.nextPage || null;

      // Cached DOM refs
      this.nextBtn = document.querySelector('.btn-next');
      this.prevBtn = document.querySelector('.btn-prev');
      this.hintEl = document.querySelector('.click-hint');
      this.counterEl = document.querySelector('.slide-counter');
      this.progressEl = document.querySelector('.progress-fill');
      this.obsLogEl = document.querySelector('.obs-log');

      this._lock = false;
      this._autoplayTimer = null;

      this.init();
    }

    /* ── Init ──────────────────────────────────────────────── */
    init() {
      // Show first image, hide rest
      this.images.forEach((img, i) => {
        if (i === 0) {
          img.classList.add('visible');
          img.style.opacity = '1';
          img.style.pointerEvents = 'auto';
        } else {
          img.classList.remove('visible');
          img.style.opacity = '0';
          img.style.pointerEvents = 'none';
        }
      });

      this.container.style.cursor = 'pointer';
      this.container.setAttribute('role', 'button');
      this.container.setAttribute('tabindex', '0');
      this.container.setAttribute('aria-label', 'Click or press Enter/Space to advance animation frame');

      // Click to advance
      this.container.addEventListener('click', () => this.advance());
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.advance();
        }
      });

      // Keyboard nav (document level)
      this._keydownHandler = (e) => this._handleKey(e);
      document.addEventListener('keydown', this._keydownHandler);

      // Nav buttons
      this._setupNav();

      // Initial UI update
      this._updateUI();
    }

    /* ── Core: advance one frame ───────────────────────────── */
    advance() {
      if (this._lock || this.current >= this.total - 1) return;

      this.current++;

      const prevImg = this.images[this.current - 1];
      const currImg = this.images[this.current];

      if (prevImg) {
        prevImg.classList.remove('visible');
        prevImg.style.opacity = '0';
        prevImg.style.pointerEvents = 'none';
      }
      if (currImg) {
        currImg.classList.add('visible');
        currImg.style.opacity = '1';
        currImg.style.pointerEvents = 'auto';
      }

      this._updateUI();

      // Debounce lock
      this._lock = true;
      const dur = parseFloat(getComputedStyle(currImg).transitionDuration) * 1000 || 400;
      setTimeout(() => { this._lock = false; }, dur + 100);
    }

    /* ── Back up one frame ─────────────────────────────────── */
    goBack() {
      if (this.current <= 0) return;

      const currImg = this.images[this.current];
      this.current--;
      const prevImg = this.images[this.current];

      if (currImg) {
        currImg.classList.remove('visible');
        currImg.style.opacity = '0';
        currImg.style.pointerEvents = 'none';
      }
      if (prevImg) {
        prevImg.classList.add('visible');
        prevImg.style.opacity = '1';
        prevImg.style.pointerEvents = 'auto';
      }

      this._updateUI();
    }

    /* ── UI updates ────────────────────────────────────────── */
    _updateUI() {
      // Counter
      if (this.counterEl) {
        this.counterEl.textContent = `${this.current + 1} / ${this.total}`;
      }

      // Obs log
      if (this.obsLogEl) {
        this.obsLogEl.textContent = `Frame ${this.current + 1} of ${this.total}`;
        this.obsLogEl.classList.add('show');
      }

      // Progress bar
      if (this.progressEl) {
        const pct = ((this.current + 1) / this.total) * 100;
        this.progressEl.style.width = `${pct}%`;
      }

      // Click hint
      if (this.hintEl) {
        this.hintEl.style.display = (this.current >= this.total - 1) ? 'none' : 'block';
      }

      // Next button (show on last frame)
      if (this.nextBtn) {
        if (this.current >= this.total - 1) {
          this.nextBtn.classList.add('show');
          this.nextBtn.removeAttribute('aria-hidden');
          this.nextBtn.setAttribute('tabindex', '0');
        } else {
          this.nextBtn.classList.remove('show');
          this.nextBtn.setAttribute('aria-hidden', 'true');
          this.nextBtn.setAttribute('tabindex', '-1');
        }
      }
    }

    /* ── Navigation buttons ──────────────────────────────── */
    _setupNav() {
      if (this.prevBtn && this.prevPage) {
        this.prevBtn.addEventListener('click', () => {
          window.location.href = this.prevPage;
        });
      }
      if (this.nextBtn) {
        if (this.nextPage) {
          this.nextBtn.addEventListener('click', () => {
            window.location.href = this.nextPage;
          });
        } else {
          // Last step: change to "Finish" and go to landing page
          this.nextBtn.textContent = 'Finish ▶';
          this.nextBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
          });
        }
      }
    }

    /* ── Keyboard support ─────────────────────────────────── */
    _handleKey(e) {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          this.advance();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.goBack();
          break;
        case 'Escape':
          if (this.hintEl) {
            this.hintEl.style.display = 'none';
          }
          break;
      }
    }

    /* ── Cleanup ──────────────────────────────────────────── */
    destroy() {
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
      }
    }
  }

  // Expose
  window.SimStep = SimStep;
})();
