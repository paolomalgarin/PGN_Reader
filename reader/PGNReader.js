import { MoveNode } from "./MoveNode.js";
import { MoveTree, DEFAULT_ROOT_COMMENT } from "./MoveTree.js";
import { extractContentOnly } from "./commentFormat.js";
import { detectStartingPosition, defaultVariationLabelFor } from "./startingPosition.js";

// Riconosce le righe di intestazione "[Nome "Valore"]" del "Seven Tag Roster"
// PGN (Event/Site/Date/... ma anche tag custom come FEN/SetUp/Variant/ECO).
const HEADER_LINE_REGEX = /^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm;

// Ordine convenzionale del "Seven Tag Roster": questi vanno scritti per
// primi in fase di export, il resto segue nell'ordine in cui è stato letto.
const HEADER_PRIORITY = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];

export class PGNReader {
    static TOKEN_REGEX = new RegExp(
        [
            /(?<comment>\{[^}]*\})/.source,
            /(?<variationStart>\()/.source,
            /(?<variationEnd>\))/.source,
            /(?<moveNumber>\d+\.(?:\.\.)?)/.source,
            /(?<result>1-0|0-1|1\/2-1\/2|\*)/.source,
            /(?<san>O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)/.source,
            /(?<nag>\$\d+)/.source,
        ].join('|'),
        'g'
    );

    /**
     * @param {String} pgnString
     * @returns {MoveTree}
     */
    static read(pgnString) {
        // FONDAMENTALE: gli header "[...]" vanno tolti PRIMA di tokenizzare il
        // movetext, non semplicemente "ignorati" dal tokenizer. Il valore di
        // un header (in particolare il FEN di partenza per Chess960/posizioni
        // custom) può contenere frammenti che sembrano mosse valide — es. un
        // alfiere nero in una casa con case vuote adiacenti nel FEN produce
        // testo tipo "3b4", che la regex SAN interpreta come una mossa vera,
        // corrompendo tutto l'albero. Separare nettamente header e movetext
        // elimina il problema alla radice, qualunque sia il contenuto degli
        // header.
        const { headers, movetext } = this._splitHeaders(pgnString);
        const { kind, fen } = detectStartingPosition(headers);

        const tokens = this._tokenize(movetext);
        const rootNode = this._buildRootNode(tokens);

        const defaultComment = kind === 'standard'
            ? DEFAULT_ROOT_COMMENT
            : `<opening>Starting Position</opening>\n\n<variation>${defaultVariationLabelFor(kind)}</variation>`;

        return new MoveTree(rootNode, { startingFen: fen, defaultComment, headers });
    }

    /**
     * Separa gli header "[Tag "Valore"]" dal resto del testo (il movetext
     * vero e proprio), che gli header possono precedere ovunque nel file (non
     * necessariamente solo in cima, anche se è la convenzione standard).
     *
     * @param {String} pgnString
     * @returns {{headers: Object<String,String>, movetext: String}}
     */
    static _splitHeaders(pgnString) {
        const headers = {};
        const movetext = pgnString.replace(HEADER_LINE_REGEX, (_match, name, value) => {
            headers[name] = value.replace(/\\(.)/g, '$1'); // de-escape \" e \\
            return '';
        });
        return { headers, movetext };
    }

    /**
     * @param {String} pgnString
     * @returns {Object[]}
     */
    static _tokenize(pgnString) {
        const tokens = [];

        for (const match of pgnString.matchAll(this.TOKEN_REGEX)) {
            const type = Object.keys(match.groups).find(
                key => match.groups[key] !== undefined
            );

            tokens.push({ str: match[0], type });
        }

        return tokens;
    }

    /**
     * @param {Object[]} tokens
     * @returns {MoveNode} il nodo radice grezzo (senza commento di default né
     *          startingFen/headers: quelli li applica read() al MoveTree)
     */
    static _buildRootNode(tokens) {
        let tree = new MoveNode({
            move: 'root',
            ply: 0
        });
        const stack = [];
        const plyStack = [];

        let currentNode = tree;
        let ply = 1;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'san') {
                let node = new MoveNode({
                    move: token.str,
                    ply: ply++,
                });

                currentNode.addChildren(node);

                currentNode = node;

            } else if (token.type === 'comment') {
                // token.str è l'intero match "{...}" comprese le graffe: le togliamo
                // per tenere in node.comment solo il contenuto pulito. write() le
                // riaggiunge in fase di export — così il round-trip read→write→read
                // resta coerente e non si accumulano graffe doppie.
                currentNode.setComment(token.str.slice(1, -1));

            } else if (token.type === 'nag') {
                currentNode.addNag(token.str);

            } else if (token.type === 'variationStart') {
                stack.push(currentNode);
                plyStack.push(ply);
                ply--;
                currentNode = currentNode.parent;

            } else if (token.type === 'variationEnd') {
                ply = plyStack.pop();
                currentNode = stack.pop();
            }
        }

        return tree;
    }

    // ----- SCRITTURA (albero -> stringa PGN) -----

    /**
     * Serializza un MoveTree in una stringa PGN, varianti annidate comprese.
     * È l'inverso di read(): read(write(tree)) produce (a meno di spaziatura)
     * lo stesso albero.
     *
     * @param {MoveTree} tree
     * @param {Object} [options]
     * @param {boolean} [options.clean] - se true, ogni commento viene ridotto
     *        al solo testo libero (tag <content>), scartando opening/
     *        variation/line (compresi quelli auto-generati dal database ECO)
     *        e i metadati di frecce/evidenziazioni disegnate a mano — un PGN
     *        "pulito" pensato per essere condiviso o letto altrove.
     * @returns {String}
     */
    static write(tree, options = {}) {
        const { clean = false } = options;

        const headerBlock = this._writeHeaders(tree);
        const parts = [];

        const rootComment = clean ? extractContentOnly(tree.tree.comment) : tree.tree.comment;
        if (rootComment) {
            parts.push(`{${rootComment}}`);
        }
        parts.push(...this._writeChildren(tree.tree.children, true, clean));

        const movetext = parts.join(' ').trim();
        return headerBlock ? `${headerBlock}\n\n${movetext}` : movetext;
    }

    /**
     * Ricostruisce il blocco di header "[Tag "Valore"]" per il file esportato:
     * quelli originali del PGN caricato (se presenti), più SetUp/FEN se
     * l'albero parte da una posizione non standard — altrimenti riaprire il
     * file esportato altrove lo farebbe assumere (erroneamente) partito dalla
     * posizione standard.
     *
     * @param {MoveTree} tree
     * @returns {String} stringa vuota se non c'è nessun header da scrivere
     */
    static _writeHeaders(tree) {
        const headers = { ...(tree.headers || {}) };
        if (tree.startingFen) {
            headers.SetUp = '1';
            headers.FEN = tree.startingFen;
        }

        const keys = Object.keys(headers);
        if (keys.length === 0) return '';

        const ordered = [
            ...HEADER_PRIORITY.filter(k => k in headers),
            ...keys.filter(k => !HEADER_PRIORITY.includes(k)),
        ];

        return ordered
            .map(key => `[${key} "${String(headers[key]).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`)
            .join('\n');
    }

    /**
     * Scrive la sequenza a partire da un array di "children": il primo
     * (mainline) continua la linea corrente; gli altri sono varianti
     * alternative a QUEL primo figlio, scritte tra parentesi subito dopo di
     * esso e prima di proseguire con la sua stessa continuazione — esattamente
     * l'ordine con cui compaiono in un PGN standard.
     *
     * @param {MoveNode[]} children
     * @param {boolean} isFirstInSequence - se il primo figlio apre una nuova
     *        sequenza (inizio partita o inizio variante) e quindi, se è una
     *        mossa del nero, va scritto col numero di mossa e i tre puntini.
     * @param {boolean} clean
     * @returns {String[]} array di token di testo, da unire con spazi
     */
    static _writeChildren(children, isFirstInSequence, clean) {
        if (!children || children.length === 0) return [];

        const [mainChild, ...variations] = children;
        const parts = [this._writeMoveToken(mainChild, isFirstInSequence)];

        const mainSuffix = this._writeNagsAndComment(mainChild, clean);
        if (mainSuffix) parts.push(mainSuffix);

        variations.forEach(variation => {
            const inner = [this._writeMoveToken(variation, true)];
            const vSuffix = this._writeNagsAndComment(variation, clean);
            if (vSuffix) inner.push(vSuffix);
            inner.push(...this._writeChildren(variation.children, false, clean));
            parts.push('(' + inner.join(' ') + ')');
        });

        parts.push(...this._writeChildren(mainChild.children, false, clean));

        return parts;
    }

    /**
     * @param {MoveNode} node
     * @param {boolean} isFirstInSequence
     * @returns {String} es. "12. Nf3" oppure "12... Nf3" oppure solo "Nf3"
     */
    static _writeMoveToken(node, isFirstInSequence) {
        const moveNumber = Math.ceil(node.ply / 2);
        const isWhite = node.ply % 2 === 1;

        if (isWhite) return `${moveNumber}. ${node.move}`;
        return isFirstInSequence ? `${moveNumber}... ${node.move}` : node.move;
    }

    /**
     * @param {MoveNode} node
     * @param {boolean} clean
     * @returns {String} es. "$1 {bella mossa}", oppure stringa vuota se non c'è nulla
     */
    static _writeNagsAndComment(node, clean) {
        const bits = [];
        if (node.nag && node.nag.length) bits.push(node.nag.join(' '));

        const comment = clean ? extractContentOnly(node.comment) : node.comment;
        if (comment) bits.push(`{${comment}}`);

        return bits.join(' ');
    }
}
