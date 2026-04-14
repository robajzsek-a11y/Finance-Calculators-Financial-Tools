/*------------2026 Pomerancee. All rights reserved.-----------------*/
/*------------Licensed under CC BY-NC-SA 4.0------------------------*/

// ── Tile border SVG path initialisation ───────────────────────────────
// Each tile has an SVG overlay with 3 <path> elements that trace the
// tile rectangle perimeter. We set a rounded-rect path using the actual
// pixel dimensions so vector-effect:non-scaling-stroke keeps lines crisp.
function initTileBorders() {
    document.querySelectorAll('.calc-tile').forEach((tile) => {
        const svg = tile.querySelector('.tile-border');
        if (!svg) return;

        const paths = svg.querySelectorAll('path');
        if (!paths.length) return;

        // Use the SVG viewBox (0 0 100 100) with a rectangle path.
        // preserveAspectRatio="none" on the SVG makes it stretch to fill the tile.
        // pathLength="100" keeps stroke-dasharray percentages consistent.
        const r = 8;  // corner radius in viewBox units
        const d = `M ${r},0 L ${100 - r},0 Q 100,0 100,${r} L 100,${100 - r} Q 100,100 ${100 - r},100 L ${r},100 Q 0,100 0,${100 - r} L 0,${r} Q 0,0 ${r},0 Z`;
        paths.forEach((path) => path.setAttribute('d', d));
    });
}

initTileBorders();

// ── Click ripple effect ────────────────────────────────────────────────
document.addEventListener('click', (e) => {
    const ripple = document.createElement('div');
    ripple.classList.add('bg-click-ripple');
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top  = `${e.clientY}px`;
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

// ── Parallax orbs on mouse move ────────────────────────────────────────
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');

document.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    if (orb1) {
        orb1.style.transform = `translate(${dx * 18}px, ${dy * 18}px) scale(1)`;
    }
    if (orb2) {
        orb2.style.transform = `translate(${-dx * 14}px, ${-dy * 14}px) scale(1)`;
    }
});

// ── Tile tilt effect on hover ──────────────────────────────────────────
const tiles = document.querySelectorAll('.calc-tile');

tiles.forEach((tile) => {
    tile.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const rect = tile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width  / 2;
        const cy = rect.height / 2;

        const rotateX = ((y - cy) / cy) * -5;  // max ±5deg
        const rotateY = ((x - cx) / cx) *  5;

        tile.style.transform = `
            translateY(-6px) scale(1.018)
            perspective(800px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;
    });

    tile.addEventListener('mouseleave', () => {
        tile.style.transform = '';
    });
});

// ── Intersection Observer — animate tiles in on scroll ─────────────────
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );

    tiles.forEach((tile) => {
        tile.style.animationPlayState = 'paused';
        observer.observe(tile);
    });
}
