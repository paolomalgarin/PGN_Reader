import { state, setTree, onStateChange } from "../state.js";
import { PGNReader } from "../PGNReader.js";
import { loadPgnFromFile, downloadPgnText } from "../pgnFile.js";
import { syncBoardToCurrentNode } from "../boardSync.js";

let board = null;
let els = {};

/**
 * @param {Chessboard} chessboard
 */
export function initExportTab(chessboard) {
    board = chessboard;

    els = {
        fileInput: document.getElementById('pgn-file-input'),
        btnDownload: document.getElementById('btn-download-pgn'),
        preview: document.getElementById('pgn-export-preview'),
        error: document.getElementById('pgn-import-error'),
    };

    els.fileInput.addEventListener('change', onFileChosen);
    els.btnDownload.addEventListener('click', onDownloadClick);

    onStateChange(refreshPreview);
    refreshPreview();
}

async function onFileChosen(e) {
    const file = e.target.files[0];
    if (!file) return;

    els.error.hidden = true;
    try {
        const tree = await loadPgnFromFile(file);
        board.setPosition('start');
        setTree(tree);
        syncBoardToCurrentNode(board);
    } catch (err) {
        els.error.textContent = 'Invalid PGN file: ' + err.message;
        els.error.hidden = false;
    } finally {
        e.target.value = ''; // permette di ricaricare lo stesso file
    }
}

function onDownloadClick() {
    const pgn = PGNReader.write(state.tree);
    downloadPgnText(pgn, 'game.pgn');
}

function refreshPreview() {
    els.preview.value = PGNReader.write(state.tree);
}
