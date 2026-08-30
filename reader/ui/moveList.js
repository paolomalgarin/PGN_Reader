import { state, onStateChange } from "../state.js";
import { jumpToNode } from "../navigation.js";

let board = null;
let container = null;
let afterJump = null; // callback esterna (main.js): sync + suono + notifyChange + motore

// Oltre questa profondità le varianti annidate smettono di rientrare
// ulteriormente (eviterebbe di restringere troppo la colonna disponibile su
// schermi piccoli) e condividono tutte lo stesso stile "profondo".
const MAX_INDENT_DEPTH = 4;

/**
 * @param {Chessboard} chessboard
 * @param {Function} [afterJumpCallback] - richiamata dopo un salto riuscito
 */
export function initMoveList(chessboard, afterJumpCallback) {
    board = chessboard;
    afterJump = afterJumpCallback;
    container = document.getElementById('move-list');

    onStateChange(render);
    render();
}

function render() {
    if (!container) return;
    container.innerHTML = '';

    if (state.tree.tree.children.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'move-list-empty';
        empty.textContent = '(nessuna mossa)';
        container.appendChild(empty);
        return;
    }

    const rootLine = document.createElement('div');
    rootLine.className = 'move-list-line depth-0';
    renderLine(rootLine, state.tree.tree.children, true, 0);
    container.appendChild(rootLine);

    // Porta in vista la mossa attiva SOLO dentro la move-list stessa: mai un
    // semplice active.scrollIntoView(), che risalirebbe anche i contenitori
    // scrollabili esterni (il pannello #analysis, che ora ha scroll proprio
    // per il fix del bug del commento lungo) trascinando via il commento che
    // si stava leggendo. Calcolo manuale = scroll ristretto a questo box.
    const active = container.querySelector('.move-list-move.active');
    if (active) scrollWithinContainer(active, container);
}

/**
 * Come active.scrollIntoView({block:'nearest'}), ma limitato al SOLO
 * `container` dato: non tocca lo scroll di alcun antenato. Necessario perché
 * la move-list vive dentro un pannello a sua volta scrollabile (vedi sopra).
 *
 * @param {HTMLElement} el
 * @param {HTMLElement} container
 */
function scrollWithinContainer(el, container) {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (elRect.top < containerRect.top) {
        container.scrollTop -= (containerRect.top - elRect.top);
    } else if (elRect.bottom > containerRect.bottom) {
        container.scrollTop += (elRect.bottom - containerRect.bottom);
    }
}

/**
 * Renderizza una sequenza di mosse allo STESSO livello (mainline al livello
 * corrente): la prima (mainline) continua a fluire nello stesso blocco
 * `lineEl`, mentre ogni variante alternativa apre un NUOVO blocco figlio,
 * rientrato e con un bordo colorato in base alla profondità.
 *
 * A differenza della vecchia resa "tra parentesi in linea" (che per partite
 * con più diramazioni annidate diventava un muro di testo illeggibile),
 * ogni variante è ora visivamente un blocco a parte: basta seguire il
 * rientro e il colore del bordo per capire subito a che livello si è, senza
 * dover contare le parentesi.
 *
 * @param {HTMLElement} lineEl - blocco DOM in cui continuare la linea corrente
 * @param {MoveNode[]} children - tutte le continuazioni a questo punto (la
 *        prima è la mainline, le altre sono varianti alternative)
 * @param {boolean} isFirstInSequence
 * @param {number} depth - profondità di annidamento (0 = mainline principale)
 */
function renderLine(lineEl, children, isFirstInSequence, depth) {
    if (!children || children.length === 0) return;

    const [mainChild, ...variations] = children;

    appendMoveChip(lineEl, mainChild, isFirstInSequence);

    variations.forEach(variation => {
        const varBlock = document.createElement('div');
        const d = Math.min(depth + 1, MAX_INDENT_DEPTH);
        varBlock.className = `move-list-line move-list-variation depth-${d}`;

        const marker = document.createElement('span');
        marker.className = 'move-list-branch-marker';
        marker.textContent = '↳';
        varBlock.appendChild(marker);

        appendMoveChip(varBlock, variation, true);
        renderLine(varBlock, variation.children, false, depth + 1);

        lineEl.appendChild(varBlock);
    });

    renderLine(lineEl, mainChild.children, false, depth);
}

/**
 * Aggiunge (numero di mossa incluso, se serve) la "pillola" cliccabile di
 * una singola mossa al blocco dato.
 */
function appendMoveChip(parent, node, isFirstInSequence) {
    const isWhite = node.ply % 2 === 1;
    if (isWhite) {
        const num = document.createElement('span');
        num.className = 'move-list-number';
        num.textContent = `${Math.ceil(node.ply / 2)}.`;
        parent.appendChild(num);
    } else if (isFirstInSequence) {
        const num = document.createElement('span');
        num.className = 'move-list-number';
        num.textContent = `${Math.ceil(node.ply / 2)}...`;
        parent.appendChild(num);
    }

    const span = document.createElement('span');
    span.className = 'move-list-move';
    if (node === state.tree.current) span.classList.add('active');

    span.append(node.move);

    const nag = node.nag && node.nag[0];
    if (nag) {
        const icon = document.createElement('img');
        icon.className = 'move-list-nag-icon';
        icon.src = board.getNagVisual(nag).image;
        icon.alt = nag;
        span.appendChild(icon);
    }

    span.addEventListener('click', () => onMoveClick(node));
    parent.appendChild(span);
}

function onMoveClick(node) {
    if (node === state.tree.current) return;
    jumpToNode(board, node, afterJump);
}
