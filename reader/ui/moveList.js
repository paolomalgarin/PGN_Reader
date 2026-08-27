import { state, onStateChange } from "../state.js";
import { jumpToNode } from "../navigation.js";

let board = null;
let container = null;
let afterJump = null; // callback esterna (main.js): sync + suono + notifyChange + motore

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

    renderChildren(container, state.tree.tree.children, true);

    // Porta in vista la mossa attiva senza scrollare tutto il pannello.
    const active = container.querySelector('.move-list-move.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * Renderizza una sequenza di mosse: la prima (mainline) continua la riga
 * corrente, le altre sono varianti alternative mostrate tra parentesi subito
 * dopo — stessa struttura ricorsiva di PGNReader.write(), ma con nodi DOM
 * cliccabili invece di testo.
 */
function renderChildren(parent, children, isFirstInSequence) {
    if (!children || children.length === 0) return;

    const [mainChild, ...variations] = children;

    appendMoveNumber(parent, mainChild, isFirstInSequence);
    appendMoveSpan(parent, mainChild);

    variations.forEach(variation => {
        const varEl = document.createElement('span');
        varEl.className = 'move-list-variation';
        varEl.append('(');
        appendMoveNumber(varEl, variation, true);
        appendMoveSpan(varEl, variation);
        renderChildren(varEl, variation.children, false);
        varEl.append(')');
        parent.appendChild(varEl);
        parent.append(' ');
    });

    renderChildren(parent, mainChild.children, false);
}

function appendMoveNumber(parent, node, isFirstInSequence) {
    const isWhite = node.ply % 2 === 1;
    if (isWhite) {
        parent.append(`${Math.ceil(node.ply / 2)}.`);
    } else if (isFirstInSequence) {
        parent.append(`${Math.ceil(node.ply / 2)}...`);
    }
}

function appendMoveSpan(parent, node) {
    const span = document.createElement('span');
    span.className = 'move-list-move';
    if (node === state.tree.current) span.classList.add('active');

    span.textContent = node.move;

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
    parent.append(' ');
}

function onMoveClick(node) {
    if (node === state.tree.current) return;
    jumpToNode(board, node, afterJump);
}
