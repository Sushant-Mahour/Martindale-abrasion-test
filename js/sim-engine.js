/**
 * Martindale VLab - Shared Simulation Engine v2
 *
 * Handles:
 *   - Sequential click-to-advance frame animation (fade-in, 500ms)
 *   - Interactive step-button triggers (like PPT onClick interactiveSeq)
 *   - Next/Prev step navigation
 *   - Keyboard navigation (Arrow keys, Space, Enter, Escape)
 *   - Slide counter + progress bar
 *   - Accessibility (ARIA labels, keyboard focus)
 */

(function () {
  'use strict';

  /* ── SimStep class ─────────────────────────────────────── */
  class SimStep {
    /**
     * @param {Object} opts
     * @param {string} opts.container      - CSS selector of the image wrapper
     * @param {string} [opts.prevPage]     - href for "Previous step" button
     * @param {string} [opts.nextPage]     - href for "Next step" button
     * @param {string} [opts.mode]         - 'sequential' (default) | 'interactive'
     * @param {Object[]} [opts.steps]      - For interactive mode: array of step descriptors
     *   Each step: { btnId, imgIndex, label }
     */
    constructor(opt) {
      this.container = document.querySelector(opt.container);
      if (!this.container) throw new Error(`SimStep: "${opt.container}" not found`);

      // Collect only direct <img> children (ignore nested images like animated parts)
      this.images = Array.from(this.container.children).filter(el => el.tagName === 'IMG');
      this.current = 0;
      this.total = this.images.length;

      // Navigation pages
      this.prevPage = opt.prevPage || null;
      this.nextPage = opt.nextPage || null;

      // Mode
      this.mode = opt.mode || 'sequential';
      this.stepsDef = opt.steps || [];

      // Cached DOM refs
      this.nextBtn  = document.querySelector('.btn-next');
      this.prevBtn  = document.querySelector('.btn-prev');
      this.hintEl   = document.querySelector('.click-hint');
      this.counterEl  = document.querySelector('.slide-counter');
      this.progressEl = document.querySelector('.progress-fill');

      this._lock = false;

      this.init();
    }

    /* ── Init ──────────────────────────────────────────────── */
    init() {
      // Show first image, hide rest (no fade for first)
      this.images.forEach((img, i) => {
        img.classList.toggle('active', i === 0);
        img.setAttribute('aria-hidden', i !== 0 ? 'true' : 'false');
      });

      this._updateUI();

      if (this.mode === 'interactive') {
        this._initInteractive();
      } else if (this.mode === 'auto') {
        this._initAuto();
      } else {
        this._initSequential();
      }

      // Keyboard navigation
      document.addEventListener('keydown', (e) => this._onKey(e));

      // Navigation button bindings
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this._navigate('next'));
      }
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this._navigate('prev'));
      }
    }

    /* ── Auto mode: plays automatically without clicks ──────────────── */
    _initAuto() {
      if (this.hintEl) this.hintEl.classList.add('hidden');
      
      const playNext = () => {
        if (this._lock) {
          setTimeout(playNext, 100);
          return;
        }
        if (this.current < this.total - 1) {
          this._crossfadeTo(this.current + 1);
          setTimeout(playNext, 1500); // 1.5s delay between automatic frames
        } else if (this.hintEl) {
          this.hintEl.textContent = 'Animation complete — use Next to continue';
          this.hintEl.classList.remove('hidden');
        }
      };

      // Start automatic playback after a brief initial delay
      setTimeout(playNext, 1000);

      // Still allow clicking to skip ahead
      this.container.addEventListener('click', () => this._advance());
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._advance();
        }
      });
    }

    /* ── Sequential mode: clicking anywhere on clickZone advances frame */
    _initSequential() {
      this.container.addEventListener('click', () => this._advance());
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._advance();
        }
      });
    }

    /* ── Interactive mode: click specific buttons to reveal corresponding frames */
    _initInteractive() {
      // Hide hint for interactive mode — buttons are visible
      if (this.hintEl) this.hintEl.classList.add('hidden');

      this.stepsDef.forEach((stepDef, idx) => {
        const btn = document.getElementById(stepDef.btnId);
        if (!btn) return;

        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // don't bubble to container
          this._showFrame(stepDef.imgIndex, btn);
        });

        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._showFrame(stepDef.imgIndex, btn);
          }
        });
      });

      // Also allow clicking main area if no buttons defined
      this.container.addEventListener('click', (e) => {
        if (e.target === this.container || e.target.tagName === 'IMG') {
          this._advance();
        }
      });
    }

    /* ── Show a specific frame (interactive trigger) ────────── */
    _showFrame(index, triggerBtn) {
      if (this._lock) return;
      if (index < 0 || index >= this.total) return;

      // Mark all step buttons as normal, mark this one active
      document.querySelectorAll('.step-btn-overlay').forEach(b => b.classList.remove('active-step'));
      if (triggerBtn) triggerBtn.classList.add('active-step');

      this._crossfadeTo(index);
    }

    /* ── Advance to next frame ─────────────────────────────── */
    _advance() {
      if (this._lock) return;
      if (this.current < this.total - 1) {
        this._crossfadeTo(this.current + 1);
      }
    }

    /* ── Cross-fade transition between frames ────────────────── */
    _crossfadeTo(nextIndex) {
      if (this._lock || nextIndex === this.current) return;
      this._lock = true;

      const prev = this.images[this.current];
      const next = this.images[nextIndex];

      // Fade out current
      prev.classList.remove('active');
      prev.setAttribute('aria-hidden', 'true');

      // Fade in next (CSS handles the 500ms transition)
      next.classList.add('active');
      next.setAttribute('aria-hidden', 'false');

      this.current = nextIndex;
      this._updateUI();

      setTimeout(() => { this._lock = false; }, 520);
    }

    /* ── Update progress bar, counter, hint, nav buttons ──── */
    _updateUI() {
      // Counter
      if (this.counterEl) {
        this.counterEl.textContent = `${this.current + 1} / ${this.total}`;
      }

      // Progress bar
      if (this.progressEl) {
        const pct = this.total > 1 ? (this.current / (this.total - 1)) * 100 : 100;
        this.progressEl.style.width = pct + '%';
      }

      // Hint text
      if (this.hintEl && this.mode === 'sequential') {
        if (this.current >= this.total - 1) {
          this.hintEl.textContent = 'All frames shown — use Next to continue';
          this.hintEl.classList.remove('hidden');
        } else {
          this.hintEl.textContent = `Click to reveal next step (${this.total - 1 - this.current} remaining)`;
          this.hintEl.classList.remove('hidden');
        }
      }

      // Next/Prev page buttons
      if (this.nextBtn) {
        const canNext = !!this.nextPage;
        this.nextBtn.setAttribute('aria-disabled', !canNext);
        this.nextBtn.disabled = !canNext;
        if (canNext) this.nextBtn.setAttribute('href', this.nextPage);
      }
      if (this.prevBtn) {
        const canPrev = !!this.prevPage;
        this.prevBtn.setAttribute('aria-disabled', !canPrev);
        this.prevBtn.disabled = !canPrev;
        if (canPrev) this.prevBtn.setAttribute('href', this.prevPage);
      }
    }

    /* ── Navigate to prev/next page ────────────────────────── */
    _navigate(dir) {
      const target = dir === 'next' ? this.nextPage : this.prevPage;
      if (target) window.location.href = target;
    }

    /* ── Keyboard handler ───────────────────────────────────── */
    _onKey(e) {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          this._advance();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (this.current > 0) this._crossfadeTo(this.current - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._navigate('prev');
          break;
        case 'ArrowDown':
        case 'Enter':
          // Enter on clickZone is handled by _initSequential; ArrowDown navigates
          if (e.target === document.body || e.key === 'ArrowDown') {
            e.preventDefault();
            this._navigate('next');
          }
          break;
        case 'Escape':
          window.location.href = '../index.html';
          break;
      }
    }
  }

  /* ── Expose to global scope ────────────────────────────── */
  window.SimStep = SimStep;

})();
