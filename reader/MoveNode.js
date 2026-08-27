import { isString, isInt } from "../tools/typeCheck.js";

export class MoveNode {
    move; // String (move in algebraic notation)
    ply; // int (half move)
    comment; // String (move comment)
    nag; // Array<String> (list of annotation glyphs [es. "$1"])
    parent; // MoveNode (pointer to parent node)
    children; // Array<MoveNode> (list of children nodes)

    /**
     * @param {String} move 
     * @param {int} ply 
     * @param {String} comment 
     * @param {Array<String>} nag 
     * @param {MoveNode} parent 
     * @param {Array<MoveNode>} children 
     */
    constructor({ move, ply, comment = '', nag = [], parent = null, children = [] }) {
        if (!isString(move)) throw new Error('Parameter move is required and must be a String');
        if (!isInt(ply)) throw new Error('Parameter ply is required and must be a int');

        this.move = move;
        this.ply = ply;
        this.comment = comment;
        this.nag = nag;
        this.parent = parent;
        this.children = children;
    }

    // ----- ADD -----
    /**
     * @param {Array<MoveNode>|MoveNode} children 
     * @returns {number} New length of the children list
     */
    addChildren(children = []) {
        if (Array.isArray(children)){
            children.forEach(child => {
                child.setParent(this);
            });
            return this.children.push(...children);
        }else if (children instanceof MoveNode) {
            children.setParent(this);
            return this.children.push(children);
        } else
            throw new Error('Parameter children must be a MoveNode or MoveNode[]');
    }

    /**
     * @param {Array<String>|String} nag
     * @returns {number} New length of the nag list
     */
    addNag(nag = []) {
        if (Array.isArray(nag))
            return this.nag.push(...nag);
        else if (isString(nag))
            return this.nag.push(nag);
        else
            throw new Error('Parameter nag must be a String or String[]');
    }


    // ----- REMOVE -----
    /**
     * @returns {undefined}
     */
    clearChildren() {
        this.children.length = 0;
    }

    /**
     * @param {number|MoveNode} child 
     * @returns {MoveNode} the child removed
     */
    removeChild(child) {
        if (child === null || child === undefined) return;
        let childToReturn;

        if (isInt(child)) {
            if (child >= 0 && child < this.children.length){
                childToReturn = this.children[child]
                this.children.splice(child, 1);
            }

        } else if (child instanceof MoveNode) {
            childToReturn = child;
            const index = this.children.indexOf(child);
            if (index !== -1)
                this.children.splice(index, 1);
        }

        childToReturn.setParent(null);
        return childToReturn;
    }

    /**
     * @returns {undefined}
     */
    clearNag() {
        this.nag.length = 0;
    }

    /**
     * @param {number|String} nag 
     * @returns {undefined}
     */
    removeNag(nag) {
        if (nag === null || nag === undefined) return;

        if (isInt(nag)) {
            if (nag >= 0 && nag < this.nag.length)
                this.nag.splice(nag, 1);

        } else if (isString(nag)) {
            const index = this.nag.indexOf(nag);
            if (index !== -1)
                this.nag.splice(index, 1);
        }
    }


    // ----- CONTAINS -----
    /**
     * @param {MoveNode} child 
     * @returns {boolean}
     */
    containsChild(child) {
        if (!(child instanceof MoveNode)) return false;
        return this.children.indexOf(child) !== -1;
    }

    /**
     * @param {String} move 
     * @returns {boolean}
     */
    hasMoveChild(move) {
        if(!isString(move)) console.error('Move must be string');
        for(let i = 0; i < this.children.length; i++)
            if(this.children[i].move === move) return true;
        return false;
    }

    /**
     * @param {String} nag 
     * @returns {boolean}
     */
    containsNag(nag) {
        if (!isString(nag)) return false;
        return this.nag.indexOf(nag) !== -1;
    }


    // ----- GETTERS -----
    /**
     * @param {int} index 
     * @returns {MoveNode|null}
     */
    getChild(index) {
        if (!isInt(index) || index < 0 || index >= this.children.length) return null;
        return this.children[index];
    }

    /**
     * @param {String} move 
     * @returns {MoveNode}
     */
    getMoveChild(move) {
        if(!isString(move)) console.error('Move must be string');
        for(let i = 0; i < this.children.length; i++)
            if(this.children[i].move === move) return this.children[i];
        return null;
    }


    // ----- SETTERS -----
    /**
     * 
     * @param {String} comment 
     */
    setComment(comment) {
        if (!isString(comment)) return;
        this.comment = comment;
    }
    /**
     * 
     * @param {MoveNode} parent 
     */
    setParent(parent) {
        this.parent = parent;
    }
}