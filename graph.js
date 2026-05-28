/* Scroll-driven particle field: chaos → ordered clusters.
   Particles start scattered with drift; as the user scrolls,
   they ease toward assigned cluster targets and reveal
   connecting lines — suggesting raw data resolving into findings. */
(() => {
  const canvas = document.getElementById('graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colors = ['#00B5C7', '#E84A8E', '#F5C518', '#1F2D5C', '#4FAE52'];
  const CLUSTER_COUNT = 5;
  const PARTICLE_DIVISOR = 4500;
  const LINE_DISTANCE = 90;

  let W = 0, H = 0;
  let particles = [];
  let clusters = [];
  let order = 0;          // 0 = pure chaos, 1 = fully ordered
  let targetOrder = 0;    // driven by scroll position

  class Particle {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.size = Math.random() * 1.6 + 0.9;
      // Cluster assignment + per-particle offset inside the cluster.
      this.cluster = Math.floor(Math.random() * CLUSTER_COUNT);
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 55;
      this.offX = Math.cos(a) * r;
      this.offY = Math.sin(a) * r;
      this.color = colors[this.cluster];
    }

    update() {
      // Chaos component: free drift, bouncing off edges.
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;

      // Order component: blend toward cluster target by `order`.
      if (order > 0.001) {
        const c = clusters[this.cluster];
        const tx = c.x + this.offX;
        const ty = c.y + this.offY;
        // Pull strength scales with order^2 so movement stays subtle early
        // and snaps into place near the end of the scroll.
        const pull = order * order * 0.08;
        this.x += (tx - this.x) * pull;
        this.y += (ty - this.y) * pull;
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.55 + order * 0.35;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function buildClusters() {
    clusters = [];
    // Distribute clusters along a soft horizontal band, slightly varied.
    const padX = W * 0.12;
    const usable = W - padX * 2;
    for (let i = 0; i < CLUSTER_COUNT; i++) {
      const t = (i + 0.5) / CLUSTER_COUNT;
      clusters.push({
        x: padX + usable * t + (Math.random() - 0.5) * usable * 0.08,
        y: H * (0.35 + Math.random() * 0.3),
      });
    }
  }

  function init() {
    buildClusters();
    particles = [];
    const count = Math.floor((W * H) / PARTICLE_DIVISOR);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function drawConnections() {
    if (order < 0.35) return;
    const alphaBase = (order - 0.35) / 0.65; // 0 → 1 across the back half
    const maxDist = LINE_DISTANCE;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        if (a.cluster !== b.cluster) continue; // only link same-cluster
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxDist * maxDist) continue;
        const d = Math.sqrt(d2);
        const opacity = (1 - d / maxDist) * alphaBase * 0.5;
        ctx.strokeStyle = a.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function animate() {
    // Ease current order toward target — smooth even when scroll jumps.
    order += (targetOrder - order) * 0.06;

    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.update();
      p.draw();
    }
    drawConnections();
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  function updateScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    // Reach full order around 70% of the page — last 30% stays ordered.
    targetOrder = Math.min(1, (window.scrollY / max) / 0.7);
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    init();
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', resize);

  resize();
  updateScroll();

  if (reduce) {
    // Respect reduced motion: render ordered state once, no animation loop.
    order = targetOrder = 1;
    for (let i = 0; i < 60; i++) particles.forEach(p => p.update());
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => p.draw());
    drawConnections();
  } else {
    animate();
  }
})();
