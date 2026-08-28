/**
 * Coriandoli minimal per celebrare i milestone dello streak in DRILL (ogni 5
 * mosse "a libro" consecutive). Un canvas fisso a schermo intero, disegnato
 * solo per la manciata di frame necessaria all'animazione — nessuna libreria
 * esterna, nessun asset da scaricare.
 */

const COLORS = ['#f0b93d', '#ffcf5c', '#9c8bff', '#35d493', '#ffffff'];
const GRAVITY = 0.16;
const PARTICLE_COUNT = 46;

let canvas = null;
let rafId = null;
let particles = [];

function getCanvas() {
    if (canvas) return canvas;
    canvas = document.getElementById('confetti-canvas');
    return canvas;
}

function resize(c) {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
}

/**
 * Fa esplodere una manciata di coriandoli a partire dal centro dell'elemento
 * dato (tipicamente il badge dello streak), verso il basso con un po' di
 * dispersione laterale — sobria, non invasiva, coerente col resto dell'app.
 *
 * @param {HTMLElement} [originEl] - elemento da cui far partire i coriandoli
 */
export function confettiBurst(originEl) {
    const c = getCanvas();
    if (!c) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    resize(c);

    let originX = c.width / 2;
    let originY = 60;
    if (originEl && originEl.getBoundingClientRect) {
        const rect = originEl.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
    }

    const fresh = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 7,
        vy: Math.random() * -6 - 2,
        size: Math.random() * 5 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 14,
        life: 1,
        decay: 0.008 + Math.random() * 0.006,
    }));
    particles = particles.concat(fresh);

    if (!rafId) {
        rafId = requestAnimationFrame(() => step(ctx, c));
    }
}

function step(ctx, c) {
    ctx.clearRect(0, 0, c.width, c.height);

    particles.forEach(p => {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRotation;
        p.life -= p.decay;
    });
    particles = particles.filter(p => p.life > 0 && p.y < c.height + 40);

    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
    });

    if (particles.length > 0) {
        rafId = requestAnimationFrame(() => step(ctx, c));
    } else {
        rafId = null;
        ctx.clearRect(0, 0, c.width, c.height);
    }
}
