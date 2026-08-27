import { state, setMode } from "./state.js";

const ALL_MODES = ['EDIT', 'READ', 'DRILL'];
const PORTRAIT_MODES = ['READ', 'DRILL']; // niente EDIT da verticale

/**
 * @returns {boolean} true se il dispositivo/finestra è in orientamento verticale
 */
export function isPortrait() {
    return window.matchMedia('(orientation: portrait)').matches;
}

/**
 * @returns {String[]} le modalità selezionabili nell'orientamento corrente
 */
export function getAvailableModes() {
    return isPortrait() ? PORTRAIT_MODES : ALL_MODES;
}

/**
 * Passa alla modalità successiva nel ciclo, saltando quelle non disponibili
 * per l'orientamento corrente (es. in verticale salta sempre EDIT).
 */
export function cycleMode() {
    const available = getAvailableModes();
    const idx = available.indexOf(state.mode);
    const next = available[(idx + 1) % available.length] || available[0];
    setMode(next);
}

/**
 * Se la modalità attiva non è più valida per l'orientamento corrente (es. il
 * telefono viene ruotato in verticale mentre si era in EDIT), la riporta alla
 * prima modalità disponibile. Da richiamare all'avvio e ad ogni cambio di
 * orientamento/dimensione della finestra.
 */
export function enforceModeConstraints() {
    const available = getAvailableModes();
    if (!available.includes(state.mode)) {
        setMode(available[0]);
    }
}

/**
 * Collega il controllo dei vincoli di modalità ai cambi di orientamento e
 * ridimensionamento, e lo esegue subito una prima volta.
 */
export function initModeHandling() {
    // In verticale si parte forzatamente da READ (mai da EDIT, che in
    // verticale non è comunque disponibile) e mai da DRILL: l'utente deve
    // poter scegliere consapevolmente di avviare la riproduzione automatica.
    if (isPortrait() && state.mode === 'EDIT') {
        setMode('READ');
    }
    enforceModeConstraints();

    window.addEventListener('resize', enforceModeConstraints);
    window.matchMedia('(orientation: portrait)').addEventListener('change', enforceModeConstraints);
}

/**
 * In READ e DRILL le tab EDIT/EXPORT (da cui normalmente si carica un PGN da
 * file) sono nascoste: se l'albero è ancora vuoto in una di queste due
 * modalità, l'app non ha alcun modo di ricevere un PGN e va quindi mostrato
 * un gate che blocca l'interazione finché uno non viene caricato.
 *
 * @returns {boolean}
 */
export function needsPgnGate() {
    return state.mode !== 'EDIT' && state.tree.isEmpty();
}