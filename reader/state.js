import { MoveTree } from "./MoveTree.js";

/**
 * Stato centrale condiviso dell'applicazione: l'albero delle mosse corrente e
 * la modalità attiva (EDIT / READ / DRILL). Nessun modulo tiene una propria
 * copia di questi dati — tutti leggono da qui e passano dalle funzioni sotto
 * per modificarli, così un cambiamento (es. caricare un nuovo PGN da file, o
 * avanzare di una mossa) si propaga automaticamente a tutta la UI via
 * onStateChange(), senza dover passare riferimenti in giro manualmente.
 */
export const state = {
    tree: new MoveTree(),
    mode: 'EDIT', // 'EDIT' | 'READ' | 'DRILL'
    // true quando (in READ) si sono giocate mosse "di prova" sulla scacchiera
    // che non sono mai state aggiunte all'albero — restano visibili finché non
    // si preme il pulsante di reset o si naviga altrove, ma non fanno MAI
    // parte del PGN esportato (quello si basa solo su state.tree).
    isExploring: false,
};

const listeners = new Set();

/**
 * Registra una callback chiamata ad ogni cambiamento di stato (nuovo albero,
 * nodo corrente cambiato, modalità cambiata...).
 *
 * @param {Function} fn
 * @returns {Function} funzione per de-registrare la callback
 */
export function onStateChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/**
 * Notifica tutti gli ascoltatori che qualcosa nello stato è cambiato. Va
 * chiamata esplicitamente ogni volta che si muta `state.tree.current` (es.
 * dopo una mossa, un undo, un salto ad un nodo) o si sostituisce l'albero.
 */
export function notifyChange() {
    listeners.forEach(fn => fn(state));
}

/**
 * Sostituisce l'intero albero delle mosse (es. dopo aver caricato un PGN da
 * file) e notifica il cambiamento.
 *
 * @param {MoveTree} newTree
 */
export function setTree(newTree) {
    state.tree = newTree;
    notifyChange();
}

/**
 * Cambia la modalità attiva (EDIT / READ / DRILL) e notifica il cambiamento.
 *
 * @param {String} newMode
 */
export function setMode(newMode) {
    if (newMode === state.mode) return;
    state.mode = newMode;
    state.isExploring = false;
    notifyChange();
}

/**
 * Segna se ci si trova in una linea di esplorazione temporanea (READ) non
 * tracciata dall'albero. Notifica solo se il valore cambia davvero.
 *
 * @param {boolean} value
 */
export function setExploring(value) {
    if (state.isExploring === value) return;
    state.isExploring = value;
    notifyChange();
}
