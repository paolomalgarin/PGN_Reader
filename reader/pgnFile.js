import { PGNReader } from "./PGNReader.js";

/**
 * Legge un file PGN scelto dall'utente e lo trasforma in un MoveTree.
 * Condiviso tra il tab EXPORT ("carica file") e il gate che forza il
 * caricamento di un PGN in modalità READ/DRILL quando l'albero è vuoto.
 *
 * @param {File} file
 * @returns {Promise<MoveTree>}
 */
export function loadPgnFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const tree = PGNReader.read(String(reader.result));
                if (tree.isEmpty()) {
                    reject(new Error('Il file non contiene mosse valide.'));
                    return;
                }
                resolve(tree);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(reader.error || new Error('Impossibile leggere il file.'));
        reader.readAsText(file);
    });
}

/**
 * Avvia il download di una stringa PGN come file .pgn.
 *
 * @param {String} pgnText
 * @param {String} [filename]
 */
export function downloadPgnText(pgnText, filename = 'partita.pgn') {
    const blob = new Blob([pgnText], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}