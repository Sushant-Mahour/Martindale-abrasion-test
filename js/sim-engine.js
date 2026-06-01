/**
 * Martindale VLab - Shared Simulation Engine
 * Handles sequential click-through animations (transbox pattern)
 */

class SimStep {
  constructor(steps) {
    // steps: array of { images: [id,...], hide: [id,...], prompt: text, obs: text }
    this.steps = steps;
    this.current = 0;
    this.nextBtn = document.querySelector('.btn-next');
    this.logEl = document.querySelector('.obs-log');
  }

  init() {
    // Show first step
    this._apply(this.steps[0]);
  }

  advance() {
    this.current++;
    if (this.current >= this.steps.length) {
      // All done – show Next button
      if (this.nextBtn) this.nextBtn.classList.add('show');
      return;
    }
    this._apply(this.steps[this.current]);
  }

  _apply(step) {
    const area = document.querySelector('.img-area');

    // Hide all images first
    if (step.hideAll) {
      area.querySelectorAll('img').forEach(i => i.classList.remove('visible'));
    }

    // Hide specific
    if (step.hide) {
      step.hide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('visible');
      });
    }

    // Show specific with fade-in animation
    if (step.show) {
      step.show.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = 0;
          el.classList.add('visible');
          // Stagger fade-in
          setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease';
            el.style.opacity = 1;
          }, idx * 150);
        }
      });
    }

    // Update prompt / log
    if (step.obs && this.logEl) {
      this.logEl.textContent = '→ ' + step.obs;
      this.logEl.classList.add('show');
    }

    // Show Next if last step
    if (this.current === this.steps.length - 1) {
      setTimeout(() => {
        if (this.nextBtn) this.nextBtn.classList.add('show');
      }, 700);
    }
  }
}

// Helper: wire up the entire slide as one big click zone
function wireClickZone(sim) {
  const area = document.querySelector('.img-area') || document.querySelector('.simulation-container');
  area.style.cursor = 'pointer';
  area.addEventListener('click', () => sim.advance());
}
