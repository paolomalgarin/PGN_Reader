import { MoveNode } from "./MoveNode.js";

// Commento di default per la posizione iniziale quando non ne viene fornito
// uno esplicito (nuovo albero vuoto, o PGN senza commento pre-mossa): usa
// gli stessi tag <opening>/<variation> di qualunque altro commento, quindi è
// modificabile con lo stesso editor di testo del tab EDIT.
export const DEFAULT_ROOT_COMMENT =
`<opening>Starting Position</opening>

<variation>Traditional game</variation>`;

export class MoveTree {
    tree; // MoveNode
    current; // MoveNode
    headers; // Object<String,String> - tutti i tag "[Nome \"Valore\"]" del PGN originale
    startingFen; // String|null - FEN di partenza se diversa da quella standard (Chess960/posizione custom), altrimenti null

    /**
     * @param {MoveNode} tree
     * @param {Object} [opts]
     * @param {String|null} [opts.startingFen] - FEN della posizione di partenza se non standard
     * @param {String} [opts.defaultComment] - commento da usare sulla radice se il PGN non ne fornisce uno
     * @param {Object} [opts.headers] - tag "[...]" del PGN originale, preservati per il re-export
     */
    constructor(tree = new MoveNode({ move: 'root', ply: 0 }), opts = {}) {
        const { startingFen = null, defaultComment = DEFAULT_ROOT_COMMENT, headers = {} } = opts;

        this.tree = tree;
        if (!this.tree.comment) {
            this.tree.setComment(defaultComment);
        }
        this.current = this.tree;
        this.startingFen = startingFen;
        this.headers = headers;
    }

    log() {
        // console.log(this.tree);
        this._printTree(this.tree);
    }

    _printTree(node, prefix = '', isLast = true, isRoot = true, isVariationStart = false, isLastVariation = false) {
        if (isRoot) {
            console.log('ROOT (game start)');
            node.children.forEach((child, idx) => {
                let isLast = idx === node.children.length - 1;
                this._printTree(child, '', isLast, false, node.children.length > 1, isLastVariation || isLast);
            });
            return;
        }

        const connector = isLast ? '└──⁠ ' : (isVariationStart ? '├── ' : (isLastVariation ? '    ' : '|   '));



        let nagText = '';
        node.nag.forEach(nagElm => {
            nagText += nagElm;
        });
        const moveText = `${Math.ceil(node.ply / 2)}. ${node.ply % 2 === 0 ? '..' : ''}${node.move}${nagText} ${node.comment}`;

        console.log(`${prefix}${connector}${moveText}`);


        const childPrefix = prefix + (node.children.length > 1 ? (prefix.length === 0 ? '    ' : '|   ') : '');

        node.children.forEach((child, idx) => {
            let isLast = idx === node.children.length - 1 && node.children.length > 1;
            this._printTree(child, childPrefix, isLast, false, node.children.length > 1, (isLastVariation && node.children.length === 1) || isLast);
        });

    }


    addMove(move) {
        if (this.current.hasMoveChild(move)) {
            this.current = this.current.getMoveChild(move);
        } else {
            this.current.addChildren(new MoveNode({ move: move, ply: this.current.ply + 1 }));
            this.current = this.current.children[this.current.children.length - 1];
        }
    }

    /**
     * Goes up the tree
     */
    moveUp() {
        if(!this.current.parent) return;
        this.current = this.current.parent;
    }

    /**
     * Goes down the tree (mainline)
     */
    moveDown() {
        if(this.current.children.length === 0) return;
        this.current = this.current.getChild(0);
    }

    /**
     * Torna alla radice (inizio partita), senza svuotare l'albero.
     */
    goToRoot() {
        this.current = this.tree;
    }

    /**
     * @returns {boolean} true se il nodo corrente è la radice (inizio partita)
     */
    isAtRoot() {
        return this.current === this.tree;
    }

    /**
     * @returns {boolean} true se l'albero non contiene ancora nessuna mossa
     */
    isEmpty() {
        return this.tree.children.length === 0;
    }
}