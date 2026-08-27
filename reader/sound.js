/**
 * Effetti sonori dell'app. File attesi in /assets/audio/ (percorso relativo
 * alla pagina), elencati in fondo a questo file con il nome esatto che deve
 * avere ciascun file. Se un file manca o non può essere riprodotto (es.
 * autoplay bloccato dal browser prima di un'interazione), l'errore viene
 * semplicemente ignorato: un suono mancante non deve mai rompere l'app.
 */

const SOUNDS = {
    move: 'assets/audio/move.mp3',
    capture: 'assets/audio/capture.mp3',
    check: 'assets/audio/check.mp3',
    gameEnd: 'assets/audio/game-end.mp3',
    brilliant: 'assets/audio/brilliant.mp3',
    nag: 'assets/audio/nag.mp3',
    delete: 'assets/audio/delete.mp3',
    error: 'assets/audio/error.mp3',
    notify: 'assets/audio/notify.mp3',
};

let muted = false;
const cache = new Map();

function getAudio(name) {
    if (!cache.has(name)) {
        const audio = new Audio(SOUNDS[name]);
        audio.volume = 0.5;
        cache.set(name, audio);
    }
    return cache.get(name);
}

/**
 * @param {'move'|'capture'|'check'|'gameEnd'|'brilliant'|'nag'|'delete'|'error'|'notify'} name
 */
export function playSound(name) {
    if (muted || !SOUNDS[name]) return;
    try {
        const audio = getAudio(name);
        audio.currentTime = 0;
        audio.play().catch(() => {}); // autoplay bloccato o simile: ignora silenziosamente
    } catch (err) {
        // File mancante o non riproducibile: mai bloccare l'app per questo.
    }
}

export function setMuted(value) {
    muted = !!value;
}

export function isMuted() {
    return muted;
}

/**
 * Sceglie il suono giusto per il NODO su cui ci si trova ADESSO (dopo che
 * l'albero è già stato sincronizzato) — a differenza delle due funzioni
 * sotto (che guardano solo captured/SAN), questa controlla anche i NAG:
 * una mossa marcata "brillante" ($3) suona sempre brilliant.mp3, qualunque
 * sia la fonte della mossa (drag&drop, tastiera, move-list, mossa del pc in
 * drill...). Va preferita a playMoveSound/playMoveSoundForSan ovunque sia
 * disponibile il nodo dell'albero.
 *
 * @param {MoveNode|null} node
 */
export function playMoveSoundForNode(node) {
    if (!node) return;
    if (node.nag && node.nag.includes('$3')) {
        playSound('brilliant');
        return;
    }
    playMoveSoundForSan(node.move);
}

/**
 * Sceglie il suono giusto per una mossa appena giocata (formato risultato di
 * chess.js: { captured, san, flags, ... }). Non conosce i NAG (il risultato
 * di chess.js non li porta con sé) — dove possibile preferire
 * playMoveSoundForNode.
 *
 * @param {Object} move
 */
export function playMoveSound(move) {
    if (!move) return;
    if (move.san && move.san.includes('#')) {
        playSound('gameEnd');
    } else if (move.san && move.san.includes('+')) {
        playSound('check');
    } else if (move.captured || (move.flags && move.flags.includes('e'))) {
        playSound('capture');
    } else {
        playSound('move');
    }
}

/**
 * Come playMoveSound, ma parte solo dalla stringa SAN (es. "Nxe4+"). La
 * notazione SAN standard include già `x` per le catture e `+`/`#` per
 * scacco/matto, quindi basta guardare i caratteri.
 *
 * @param {String} san
 */
export function playMoveSoundForSan(san) {
    if (!san) return;
    if (san.includes('#')) playSound('gameEnd');
    else if (san.includes('+')) playSound('check');
    else if (san.includes('x')) playSound('capture');
    else playSound('move');
}
