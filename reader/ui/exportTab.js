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
        btnDownloadClean: document.getElementById('btn-download-pgn-clean'),
        preview: document.getElementById('pgn-export-preview'),
        error: document.getElementById('pgn-import-error'),
        cleanToggle: document.getElementById('pgn-preview-clean-toggle'),
    };

    els.fileInput.addEventListener('change', onFileChosen);
    els.btnDownload.addEventListener('click', onDownloadClick);
    els.btnDownloadClean.addEventListener('click', onDownloadCleanClick);
    els.cleanToggle.addEventListener('change', refreshPreview);

    onStateChange(refreshPreview);
    refreshPreview();
}

async function onFileChosen(e) {
    const file = e.target.files[0];
    if (!file) return;

    els.error.hidden = true;
    try {
        const tree = await loadPgnFromFile(file);
        board.setPosition(tree.startingFen || 'start');
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

/**
 * Export "pulito": ogni commento viene ridotto al solo testo libero scritto
 * dall'utente (tag <content>), senza frecce/evidenziazioni disegnate a mano
 * né i nomi apertura/variante/linea (manuali o auto-generati dal database
 * ECO) — pensato per condividere la partita altrove senza il "rumore"
 * specifico di quest'app. L'export normale sopra resta comunque disponibile
 * invariato.
 */
function onDownloadCleanClick() {
    const pgn = PGNReader.write(state.tree, { clean: true });
    downloadPgnText(pgn, 'game-clean.pgn');
}

function refreshPreview() {
    const clean = !!els.cleanToggle.checked;
    els.preview.value = PGNReader.write(state.tree, { clean });
}
