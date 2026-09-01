// Riconosce che tipo di posizione di partenza descrive un PGN: la partita
// standard, una posizione Chess960 (Fischer Random) valida, oppure una
// posizione "custom" qualsiasi (es. un finale di studio, un puzzle...).
// Serve sia per scegliere il testo di default del commento sulla radice
// dell'albero, sia per inizializzare correttamente il motore chess.js quando
// si naviga (vedi navigation.js), che altrimenti assumerebbe sempre la
// partita standard.

const STANDARD_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * @param {Object<String,String>} headers - tag "[...]" del PGN, già estratti
 * @returns {{ kind: 'standard'|'chess960'|'custom', fen: String|null }}
 */
export function detectStartingPosition(headers) {
    const variantHeader = (headers.Variant || headers.Variation || '').toLowerCase();
    const fenHeader = (headers.FEN || headers.Fen || '').trim();

    if (!fenHeader) {
        return { kind: 'standard', fen: null };
    }

    const normalizedFen = normalizeFen(fenHeader);
    if (normalizedFen === normalizeFen(STANDARD_START_FEN)) {
        return { kind: 'standard', fen: null };
    }

    if (variantHeader.includes('960') || variantHeader.includes('fischer') || isChess960StartFen(fenHeader)) {
        return { kind: 'chess960', fen: fenHeader };
    }

    return { kind: 'custom', fen: fenHeader };
}

/**
 * @param {'standard'|'chess960'|'custom'} kind
 * @returns {String} il testo da usare per il tag <variation> sulla radice
 */
export function defaultVariationLabelFor(kind) {
    if (kind === 'chess960') return 'Chess 960';
    if (kind === 'custom') return 'Custom position';
    return 'Traditional game';
}

function normalizeFen(fen) {
    // Per il confronto "è la posizione standard?" contano solo piazzamento
    // pezzi + turno + arrocchi: halfmove/fullmove clock possono variare
    // legittimamente (es. "0 1" vs "0 6") senza cambiare la posizione.
    const parts = fen.trim().split(/\s+/);
    return parts.slice(0, 3).join(' ');
}

/**
 * @param {String} fen
 * @returns {boolean} true se il piazzamento descritto è una valida posizione
 *          di partenza Chess960 (permutazione lecita della riga di fondo,
 *          pedoni tutti al proprio posto, altro non specificato più stretto)
 */
function isChess960StartFen(fen) {
    const board = fen.trim().split(/\s+/)[0];
    if (!board) return false;

    const ranks = board.split('/');
    if (ranks.length !== 8) return false;

    const [rank8, rank7, ...middle] = ranks;
    const rank2 = ranks[6];
    const rank1 = ranks[7];

    // Ranghi 3-6 devono essere completamente vuoti ("8" = 8 case libere).
    for (let i = 2; i <= 5; i++) {
        if (ranks[i] !== '8') return false;
    }
    if (rank7 !== 'pppppppp' || rank2 !== 'PPPPPPPP') return false;

    return isValidBackRank(rank8, false) && isValidBackRank(rank1, true) &&
        rank8.toLowerCase() === rank1.toLowerCase(); // stesso schieramento, colori speculari
}

/**
 * @param {String} rank - es. "rnbqkbnr" o "bqnbrkrn"
 * @param {boolean} isWhite
 * @returns {boolean}
 */
function isValidBackRank(rank, isWhite) {
    if (rank.length !== 8) return false;

    const expectedLetters = isWhite ? 'RNBQKBNR' : 'rnbqkbnr';
    if ([...rank].sort().join('') !== [...expectedLetters].sort().join('')) return false;

    const chars = [...rank];
    const bishopIdx = [];
    const rookIdx = [];
    let kingIdx = -1;

    chars.forEach((c, i) => {
        const upper = c.toUpperCase();
        if (upper === 'B') bishopIdx.push(i);
        if (upper === 'R') rookIdx.push(i);
        if (upper === 'K') kingIdx = i;
    });

    if (bishopIdx.length !== 2 || rookIdx.length !== 2 || kingIdx === -1) return false;

    // Vincoli Chess960: alfieri su case di colore opposto, re strettamente
    // tra le due torri.
    if (bishopIdx[0] % 2 === bishopIdx[1] % 2) return false;
    if (!(rookIdx[0] < kingIdx && kingIdx < rookIdx[1])) return false;

    return true;
}
