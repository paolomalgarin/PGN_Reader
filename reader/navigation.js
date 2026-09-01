import { state } from "./state.js";

/**
 * Ricostruisce la posizione (FEN) del nodo target ripercorrendo l'albero
 * dalla radice, con un'istanza chess.js "usa e getta", e la applica alla
 * board con un solo setPosition(). Non passa MAI per game.move()/game.undo()
 * sulla board reale: chess.js perde la propria cronologia interna ogni volta
 * che si carica un FEN con .load() (setPosition lo fa), quindi affidarsi a
 * board.undoMove() per tornare indietro dopo un salto smette di funzionare
 * (nulla da annullare). Ricostruendo sempre dal nostro albero, che è la fonte
 * di verità, la navigazione avanti/indietro funziona allo stesso modo sia che
 * si arrivi alla posizione corrente per mosse singole sia per un salto.
 *
 * @param {Chessboard} board
 * @param {MoveNode} targetNode
 * @returns {boolean} true se il salto è andato a buon fine
 */
function rebuildAndJump(board, targetNode) {
    if (!board.game || !targetNode || typeof window.Chess !== 'function') return false;

    const path = [];
    let n = targetNode;
    while (n && n.parent) {
        path.unshift(n.move);
        n = n.parent;
    }

    // Un PGN può partire da una posizione diversa da quella standard (Chess960
    // o una posizione custom via header FEN/SetUp): senza questo, chess.js
    // ricostruirebbe SEMPRE dalla partita standard, calcolando mosse/case
    // sbagliate per qualunque partita non "tradizionale".
    const startingFen = state.tree.startingFen || undefined;
    const scratch = startingFen ? new window.Chess(startingFen) : new window.Chess();
    let lastMoveResult = null;
    for (const san of path) {
        lastMoveResult = scratch.move(san);
        if (!lastMoveResult) return false; // percorso non valido, non tocchiamo nulla
    }

    const lastMove = lastMoveResult ? { from: lastMoveResult.from, to: lastMoveResult.to } : null;
    const startingPosition = startingFen || 'start';
    board.setPosition(path.length ? scratch.fen() : startingPosition, lastMove);
    state.tree.current = targetNode;
    return true;
}

/**
 * Fa avanzare la posizione di una mossa. Se `san` non è specificato, gioca la
 * linea principale (il primo figlio del nodo corrente).
 *
 * NON notifica cambiamenti di stato né effetti collaterali (motore, suoni,
 * drill...) — se ne occupa `afterFn`, se fornita, chiamata solo in caso di
 * successo. Tenerla come parametro esplicito (invece di importarla qui)
 * evita dipendenze circolari con i moduli che sanno cosa fare dopo una mossa
 * (main.js, che conosce sia analysisTab che drill).
 *
 * @param {Chessboard} board
 * @param {Function} [afterFn]
 * @param {String} [san] - mossa in notazione SAN; default: mainline
 * @returns {boolean} true se la mossa è stata giocata
 */
export function goForward(board, afterFn, san = null) {
    const nextChild = san
        ? state.tree.current.children.find(c => c.move === san)
        : state.tree.current.children[0];
    if (!nextChild) return false;

    if (!rebuildAndJump(board, nextChild)) return false;
    if (afterFn) afterFn();
    return true;
}

/**
 * Torna indietro di una mossa. Non fa nulla se si è già all'inizio partita.
 *
 * @param {Chessboard} board
 * @param {Function} [afterFn]
 * @returns {boolean} true se un passo indietro è stato fatto
 */
export function goBack(board, afterFn) {
    if (state.tree.isAtRoot()) return false;

    if (!rebuildAndJump(board, state.tree.current.parent)) return false;
    if (afterFn) afterFn();
    return true;
}

/**
 * Salta direttamente a un nodo qualsiasi dell'albero (es. click su una mossa
 * nella move-list, che può essere arbitrariamente lontana dalla posizione
 * corrente, non necessariamente un passo avanti/indietro).
 *
 * @param {Chessboard} board
 * @param {MoveNode} targetNode
 * @param {Function} [afterFn]
 * @returns {boolean} true se il salto è andato a buon fine
 */
export function jumpToNode(board, targetNode, afterFn) {
    if (!rebuildAndJump(board, targetNode)) return false;
    if (afterFn) afterFn();
    return true;
}

/**
 * Collega le frecce sx/dx della tastiera alla navigazione avanti/indietro.
 * Ignora l'input quando il focus è su un campo di testo (per non rubare le
 * frecce mentre si scrive un commento nel tab EDIT).
 *
 * @param {Chessboard} board
 * @param {Function} [afterFn] - richiamata dopo ogni navigazione riuscita
 * @returns {Function} funzione per rimuovere il listener
 */
export function attachKeyboardNavigation(board, afterFn) {
    const handler = (e) => {
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goBack(board, afterFn);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goForward(board, afterFn);
        }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
}

/**
 * Risolve le caselle di partenza/arrivo di una mossa SAN nella posizione
 * ATTUALE della board, usando un'istanza chess.js "usa e getta". Serve per
 * disegnare le frecce delle mosse disponibili (che l'albero conosce solo
 * come stringhe SAN, non come caselle).
 *
 * @param {Chessboard} board
 * @param {String} san
 * @returns {{from: String, to: String}|null}
 */
export function sanToFromTo(board, san) {
    if (!board.game || typeof window.Chess !== 'function') return null;
    const scratch = new window.Chess(board.game.fen());
    const result = scratch.move(san);
    return result ? { from: result.from, to: result.to } : null;
}
