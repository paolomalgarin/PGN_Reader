import { MoveNode } from "./MoveNode.js";
import { MoveTree } from "./MoveTree.js";

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
        let tree = null;

        const tokens = this._tokenize(pgnString);
        // console.log(tokens);

        tree = this._mkTree(tokens, 1);

        // tree.log();

        return tree;
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
     * @param {int} startingPly
     * @returns {MoveNode} 
     */
    static _mkTree(tokens) {
        let tree = new MoveNode({
            move: 'root',
            ply: 0
        });
        const stack = [];
        const plyStack = [];

        let currentNode = tree;
        let ply = 1;
        
        for(let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if(token.type === 'san') {
                let node = new MoveNode({
                    move: token.str,
                    ply: ply++,
                });

                currentNode.addChildren(node);
                
                currentNode = node;

            } else if(token.type === 'comment') {
                // token.str è l'intero match "{...}" comprese le graffe: le togliamo
                // per tenere in node.comment solo il contenuto pulito. write() le
                // riaggiunge in fase di export — così il round-trip read→write→read
                // resta coerente e non si accumulano graffe doppie.
                currentNode.setComment(token.str.slice(1, -1));

            } else if(token.type === 'nag') {
                currentNode.addNag(token.str);

            } else if(token.type === 'variationStart') {
                stack.push(currentNode);
                plyStack.push(ply);
                ply--;
                currentNode = currentNode.parent;
                
            } else if(token.type === 'variationEnd') {
                ply = plyStack.pop();
                currentNode = stack.pop();   
            }
        }

        // tree = tree.removeChild(0);
        return new MoveTree(tree);
    }

    // ----- SCRITTURA (albero -> stringa PGN) -----

    /**
     * Serializza un MoveTree in una stringa PGN, varianti annidate comprese.
     * È l'inverso di read(): read(write(tree)) produce (a meno di spaziatura)
     * lo stesso albero.
     *
     * @param {MoveTree} tree
     * @returns {String}
     */
    static write(tree) {
        const parts = [];
        if (tree.tree.comment) {
            parts.push(`{${tree.tree.comment}}`);
        }
        parts.push(...this._writeChildren(tree.tree.children, true));
        return parts.join(' ').trim();
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
     * @returns {String[]} array di token di testo, da unire con spazi
     */
    static _writeChildren(children, isFirstInSequence) {
        if (!children || children.length === 0) return [];

        const [mainChild, ...variations] = children;
        const parts = [this._writeMoveToken(mainChild, isFirstInSequence)];

        const mainSuffix = this._writeNagsAndComment(mainChild);
        if (mainSuffix) parts.push(mainSuffix);

        variations.forEach(variation => {
            const inner = [this._writeMoveToken(variation, true)];
            const vSuffix = this._writeNagsAndComment(variation);
            if (vSuffix) inner.push(vSuffix);
            inner.push(...this._writeChildren(variation.children, false));
            parts.push('(' + inner.join(' ') + ')');
        });

        parts.push(...this._writeChildren(mainChild.children, false));

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
     * @returns {String} es. "$1 {bella mossa}", oppure stringa vuota se non c'è nulla
     */
    static _writeNagsAndComment(node) {
        const bits = [];
        if (node.nag && node.nag.length) bits.push(node.nag.join(' '));
        if (node.comment) bits.push(`{${node.comment}}`);
        return bits.join(' ');
    }
}