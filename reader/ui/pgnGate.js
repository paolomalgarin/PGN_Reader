import { setTree } from "../state.js";
import { loadPgnFromFile } from "../pgnFile.js";
import { syncBoardToCurrentNode } from "../boardSync.js";

let overlayEl = null;
let boardRef = null;

function ensureOverlay() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.className = 'pgn-gate-overlay';
    overlayEl.innerHTML = `
        <div class="pgn-gate-box">
            <p class="pgn-gate-title">Load a game to get started</p>
            <p class="pgn-gate-hint">A PGN file is required — this mode doesn't let you write one from scratch.</p>
            <label class="pgn-gate-file-label">
                Choose .pgn file
                <input type="file" accept=".pgn,.txt,text/plain,*/*" class="pgn-gate-file" />
            </label>
            <p class="pgn-gate-error" hidden></p>
        </div>
    `;

    const input = overlayEl.querySelector('.pgn-gate-file');
    const errorEl = overlayEl.querySelector('.pgn-gate-error');

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        errorEl.hidden = true;
        try {
            const tree = await loadPgnFromFile(file);
            if (boardRef) boardRef.setPosition('start');
            setTree(tree);
            if (boardRef) syncBoardToCurrentNode(boardRef);
            // hidePgnGate() viene chiamato dal listener centrale in main.js
            // non appena si accorge che state.tree non è più vuoto.
        } catch (err) {
            errorEl.textContent = 'Invalid file: ' + err.message;
            errorEl.hidden = false;
        } finally {
            input.value = '';
        }
    });

    document.body.appendChild(overlayEl);
    return overlayEl;
}

/**
 * @param {Chessboard} board
 */
export function showPgnGate(board) {
    boardRef = board;
    ensureOverlay().classList.add('visible');
}

export function hidePgnGate() {
    if (overlayEl) overlayEl.classList.remove('visible');
}
