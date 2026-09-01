// Sottoinsieme curato dell'Encyclopedia of Chess Openings (ECO), nello
// stesso stile di classificazione e formato nome ("Famiglia: Variante,
// Sottovariante") usato dal dataset open-source di lichess
// (github.com/lichess-org/chess-openings — dati di pubblico dominio).
//
// NOTA: coprire l'intero dataset lichess (~3200 righe nei file a.tsv..e.tsv)
// richiederebbe di scaricarlo da GitHub, non raggiungibile dalla rete
// dell'ambiente in cui questo file è stato scritto. Qui è incluso un
// sottoinsieme solido delle aperture e varianti più comuni, sufficiente per
// la stragrande maggioranza delle partite reali. Per una copertura completa
// in futuro, generare le stesse triple [mosse, eco, nome] da a.tsv..e.tsv e
// sostituire/estendere ECO_ENTRIES sotto — la struttura dati e la funzione
// di ricerca restano identiche.

const ECO_ENTRIES = [
    // --- A: aperture di fianchetto / irregolari ---
    ['Nf3', 'A04', "Réti Opening"],
    ['Nf3 d5', 'A06', "Réti Opening"],
    ['Nf3 Nf6', 'A04', "Réti Opening"],
    ['c4', 'A10', "English Opening"],
    ['c4 e5', 'A20', "English Opening: Reversed Sicilian"],
    ['c4 c5', 'A34', "English Opening: Symmetrical Variation"],
    ['c4 Nf6', 'A15', "English Opening: Anglo-Indian Defense"],
    ['c4 e5 Nc3 Nf6', 'A21', "English Opening: Reversed Sicilian"],
    ['g3', 'A00', "King's Fianchetto Opening"],
    ['b3', 'A01', "Nimzo-Larsen Attack"],
    ['f4', 'A02', "Bird's Opening"],
    ['f4 d5', 'A03', "Bird's Opening"],
    ['b4', 'A00', "Sokolsky Opening"],
    ['Nc3', 'A00', "Van Geet Opening"],
    ['g4', 'A00', "Grob's Attack"],
    ['e3', 'A00', "Van't Kruijs Opening"],
    ['d3', 'A00', "Mieses Opening"],
    ['c3', 'A00', "Saragossa Opening"],
    ['a3', 'A00', "Anderssen's Opening"],

    // --- A/D/E: 1. d4 e derivati ---
    ['d4', 'D00', "Queen's Pawn Game"],
    ['d4 d5', 'D00', "Queen's Pawn Game"],
    ['d4 d5 Nf3', 'D02', "Queen's Pawn Game"],
    ['d4 d5 Nf3 Nf6 Bf4', 'D02', "Queen's Pawn Game: London System"],
    ['d4 d5 Nf3 Nf6 e3', 'D05', "Queen's Pawn Game: Colle System"],
    ['d4 d5 c4', 'D06', "Queen's Gambit"],
    ['d4 d5 c4 dxc4', 'D20', "Queen's Gambit Accepted"],
    ['d4 d5 c4 e6', 'D30', "Queen's Gambit Declined"],
    ['d4 d5 c4 e6 Nc3 Nf6', 'D37', "Queen's Gambit Declined"],
    ['d4 d5 c4 e6 Nc3 Nf6 Bg5', 'D50', "Queen's Gambit Declined"],
    ['d4 d5 c4 e6 Nc3 Bb4', 'D31', "Queen's Gambit Declined: Ragozin Defense"],
    ['d4 d5 c4 c6', 'D10', "Slav Defense"],
    ['d4 d5 c4 c6 Nc3 Nf6 Nf3 dxc4', 'D15', "Slav Defense"],
    ['d4 d5 c4 c6 Nf3 Nf6 Nc3 e6', 'D43', "Semi-Slav Defense"],
    ['d4 d5 c4 c6 Nc3 dxc4', 'D10', "Slav Defense: Central Variation"],
    ['d4 d5 exd5', 'D00', "Queen's Pawn Game: Blackmar-Diemer Gambit"],
    ['d4 Nf6', 'A45', "Indian Defense"],
    ['d4 Nf6 Bg5', 'A45', "Indian Defense: Trompowsky Attack"],
    ['d4 Nf6 Nf3 e6 Bg5', 'A46', "Queen's Pawn Game: Torre Attack"],
    ['d4 Nf6 c4', 'A50', "Indian Defense"],
    ['d4 Nf6 c4 e5', 'A51', "Budapest Gambit"],
    ['d4 Nf6 c4 g6', 'E60', "King's Indian Defense"],
    ['d4 Nf6 c4 g6 Nc3 Bg7 e4 d6', 'E70', "King's Indian Defense"],
    ['d4 Nf6 c4 g6 Nc3 d5', 'D80', "Grünfeld Defense"],
    ['d4 Nf6 c4 e6', 'E00', "Indian Defense"],
    ['d4 Nf6 c4 e6 g3', 'E00', "Catalan Opening"],
    ['d4 Nf6 c4 e6 Nc3 Bb4', 'E20', "Nimzo-Indian Defense"],
    ['d4 Nf6 c4 e6 Nc3 Bb4 e3', 'E40', "Nimzo-Indian Defense"],
    ['d4 Nf6 c4 e6 Nc3 Bb4 Qc2', 'E32', "Nimzo-Indian Defense: Classical Variation"],
    ['d4 Nf6 c4 e6 Nf3 b6', 'E12', "Queen's Indian Defense"],
    ['d4 Nf6 c4 c5', 'A56', "Benoni Defense"],
    ['d4 Nf6 c4 c5 d5 b5', 'A57', "Benko Gambit"],
    ['d4 Nf6 c4 c5 d5 e6', 'A60', "Benoni Defense"],
    ['d4 f5', 'A80', "Dutch Defense"],
    ['d4 g6', 'A42', "Modern Defense"],
    ['d4 d6', 'A41', "Queen's Pawn Game"],

    // --- C: 1. e4 e5 (partite aperte) e Francese ---
    ['e4', 'B00', "King's Pawn Game"],
    ['e4 e5', 'C20', "King's Pawn Game"],
    ['e4 e5 Nf3', 'C40', "King's Knight Opening"],
    ['e4 e5 Nf3 Nc6', 'C44', "King's Pawn Game"],
    ['e4 e5 Nf3 Nc6 Bb5', 'C60', "Ruy Lopez"],
    ['e4 e5 Nf3 Nc6 Bb5 a6', 'C70', "Ruy Lopez: Morphy Defense"],
    ['e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6', 'C77', "Ruy Lopez: Morphy Defense"],
    ['e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7', 'C84', "Ruy Lopez: Closed Variation"],
    ['e4 e5 Nf3 Nc6 Bb5 Nf6', 'C65', "Ruy Lopez: Berlin Defense"],
    ['e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4', 'C67', "Ruy Lopez: Berlin Defense, Open Variation"],
    ['e4 e5 Nf3 Nc6 Bb5 f5', 'C63', "Ruy Lopez: Schliemann Defense"],
    ['e4 e5 Nf3 Nc6 Bc4', 'C50', "Italian Game"],
    ['e4 e5 Nf3 Nc6 Bc4 Bc5', 'C50', "Italian Game: Giuoco Piano"],
    ['e4 e5 Nf3 Nc6 Bc4 Bc5 b4', 'C51', "Evans Gambit"],
    ['e4 e5 Nf3 Nc6 Bc4 Nf6', 'C55', "Italian Game: Two Knights Defense"],
    ['e4 e5 Nf3 Nc6 d4', 'C44', "Scotch Game"],
    ['e4 e5 Nf3 Nc6 d4 exd4 Nxd4', 'C45', "Scotch Game"],
    ['e4 e5 Nf3 Nf6', 'C42', "Russian Game"],
    ['e4 e5 Nf3 d6', 'C41', "Philidor Defense"],
    ['e4 e5 Nc3', 'C25', "Vienna Game"],
    ['e4 e5 f4', 'C30', "King's Gambit"],
    ['e4 e5 f4 exf4', 'C34', "King's Gambit Accepted"],
    ['e4 e5 f4 Bc5', 'C30', "King's Gambit Declined"],
    ['e4 e5 Bc4', 'C23', "Bishop's Opening"],
    ['e4 e6', 'C00', "French Defense"],
    ['e4 e6 d4 d5', 'C01', "French Defense"],
    ['e4 e6 d4 d5 Nc3', 'C11', "French Defense"],
    ['e4 e6 d4 d5 Nc3 Bb4', 'C15', "French Defense: Winawer Variation"],
    ['e4 e6 d4 d5 Nd2', 'C03', "French Defense: Tarrasch Variation"],
    ['e4 e6 d4 d5 e5', 'C02', "French Defense: Advance Variation"],
    ['e4 e6 d4 d5 exd5', 'C01', "French Defense: Exchange Variation"],

    // --- B: Siciliana, Caro-Kann, Pirc, Alekhine, Scandinava, Moderna ---
    ['e4 c5', 'B20', "Sicilian Defense"],
    ['e4 c5 c3', 'B22', "Sicilian Defense: Alapin Variation"],
    ['e4 c5 Nc3', 'B23', "Sicilian Defense: Closed Variation"],
    ['e4 c5 Nf3', 'B27', "Sicilian Defense"],
    ['e4 c5 Nf3 d6', 'B50', "Sicilian Defense"],
    ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', 'B90', "Sicilian Defense: Najdorf Variation"],
    ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6', 'B70', "Sicilian Defense: Dragon Variation"],
    ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6', 'B80', "Sicilian Defense: Scheveningen Variation"],
    ['e4 c5 Nf3 Nc6', 'B30', "Sicilian Defense"],
    ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5', 'B33', "Sicilian Defense: Sveshnikov Variation"],
    ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6', 'B34', "Sicilian Defense: Accelerated Dragon"],
    ['e4 c5 Nf3 e6', 'B40', "Sicilian Defense"],
    ['e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6', 'B44', "Sicilian Defense: Taimanov Variation"],
    ['e4 c6', 'B10', "Caro-Kann Defense"],
    ['e4 c6 d4 d5', 'B12', "Caro-Kann Defense"],
    ['e4 c6 d4 d5 e5', 'B12', "Caro-Kann Defense: Advance Variation"],
    ['e4 c6 d4 d5 exd5 cxd5', 'B13', "Caro-Kann Defense: Exchange Variation"],
    ['e4 c6 d4 d5 Nc3', 'B15', "Caro-Kann Defense"],
    ['e4 c6 d4 d5 Nc3 dxe4 Nxe4', 'B17', "Caro-Kann Defense: Classical Variation"],
    ['e4 c6 d4 d5 Nd2', 'B12', "Caro-Kann Defense: Karpov Variation"],
    ['e4 d5', 'B01', "Scandinavian Defense"],
    ['e4 d5 exd5 Qxd5', 'B01', "Scandinavian Defense"],
    ['e4 d6', 'B07', "Pirc Defense"],
    ['e4 d6 d4 Nf6 Nc3 g6', 'B07', "Pirc Defense"],
    ['e4 g6', 'B06', "Modern Defense"],
    ['e4 Nf6', 'B02', "Alekhine Defense"],
    ['e4 Nf6 e5 Nd5', 'B03', "Alekhine Defense"],
];

const ECO_MAP = new Map(ECO_ENTRIES.map(([moves, eco, name]) => [moves, { eco, name }]));

/**
 * Cerca l'apertura corrispondente alla sequenza di mosse data, provando la
 * corrispondenza più lunga possibile e accorciando progressivamente (es. se
 * la posizione esatta non è nel database, prova senza l'ultima mossa, e così
 * via) — così una mossa "fuori teoria" mostra comunque il nome
 * dell'apertura/variante più specifica nota fino a quel punto, esattamente
 * come fa lichess nel proprio explorer.
 *
 * @param {String[]} sanMoves - mosse in notazione SAN dalla radice al nodo
 *        corrente (es. ['e4','e5','Nf3','Nc6','Bb5'])
 * @returns {{eco:String,name:String,family:String,subVariation:String|null}|null}
 */
export function lookupOpening(sanMoves) {
    if (!sanMoves || sanMoves.length === 0) return null;

    for (let len = sanMoves.length; len >= 1; len--) {
        const key = sanMoves.slice(0, len).join(' ');
        const hit = ECO_MAP.get(key);
        if (hit) {
            const colonIdx = hit.name.indexOf(':');
            const family = colonIdx === -1 ? hit.name : hit.name.slice(0, colonIdx).trim();
            const subVariation = colonIdx === -1 ? null : hit.name.slice(colonIdx + 1).trim();
            return { eco: hit.eco, name: hit.name, family, subVariation };
        }
    }
    return null;
}
