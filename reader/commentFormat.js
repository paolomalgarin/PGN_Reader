/**
 * Il commento di una mossa può contenere un piccolo set di tag custom per
 * dargli uno stile in fase di visualizzazione:
 *
 *   <opening>Difesa Siciliana</opening>
 *   <variation>Variante Najdorf</variation>
 *   <line>6. Be3</line>
 *   <content>Testo libero del commento...</content>
 *
 * Non è PGN standard: è un formato interno di questa app. Il tab EDIT modifica
 * direttamente il testo grezzo (con i tag); il tab ANALYSIS lo interpreta e lo
 * mostra con uno stile diverso per ciascuna parte. Un commento senza nessun tag
 * riconosciuto viene trattato per intero come "content" libero, così i PGN
 * importati da altre fonti (commenti semplici tra graffe) restano leggibili.
 */

const TAGS = ['opening', 'variation', 'line', 'content'];

/**
 * @param {String} raw - il commento grezzo così com'è salvato sul nodo
 * @returns {{opening: String, variation: String, line: String, content: String}}
 */
export function parseComment(raw) {
    const parts = { opening: '', variation: '', line: '', content: '' };
    if (!raw) return parts;

    // I tag di metadato (frecce/evidenziazioni salvate, vedi più sotto) non
    // vanno mai considerati come "testo del commento": li togliamo prima di
    // decidere se il resto va mostrato come contenuto libero.
    const visibleRaw = raw
        .replace(/<arrows>[\s\S]*?<\/arrows>/i, '')
        .replace(/<highlights>[\s\S]*?<\/highlights>/i, '');

    let foundAny = false;
    for (const tag of TAGS) {
        const match = visibleRaw.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
        if (match) {
            parts[tag] = match[1].trim();
            foundAny = true;
        }
    }

    // Nessun tag riconosciuto: tratta l'intero commento (al netto dei metadati)
    // come testo libero.
    if (!foundAny && visibleRaw.trim()) {
        parts.content = visibleRaw.trim();
    }

    return parts;
}

/**
 * @param {String} raw
 * @returns {boolean} true se non c'è alcun contenuto (nessuna parte non vuota)
 */
export function isCommentEmpty(raw) {
    const parts = parseComment(raw);
    return !parts.opening && !parts.variation && !parts.line && !parts.content;
}

/**
 * Costruisce l'HTML da mostrare nel tab analysis a partire dal commento
 * grezzo. Ogni parte presente diventa un elemento con la propria classe CSS
 * (cb-comment-opening, cb-comment-variation, cb-comment-line,
 * cb-comment-content) così lo stile si definisce tutto in CSS.
 *
 * @param {String} raw
 * @returns {String} HTML (stringa vuota se non c'è nulla da mostrare)
 */
export function renderCommentHTML(raw) {
    const parts = parseComment(raw);
    const blocks = [];

    if (parts.opening) blocks.push(`<div class="cb-comment-opening">${escapeHTML(parts.opening)}</div>`);
    if (parts.variation) blocks.push(`<div class="cb-comment-variation">${escapeHTML(parts.variation)}</div>`);
    if (parts.line) blocks.push(`<div class="cb-comment-line">${escapeHTML(parts.line)}</div>`);
    if (parts.content) blocks.push(`<div class="cb-comment-content">${escapeHTML(parts.content)}</div>`);

    return blocks.join('');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Template vuoto proposto quando si inizia a scrivere il commento di una mossa
 * da zero nel tab EDIT.
 */
export const EMPTY_COMMENT_TEMPLATE =
`<opening></opening>

<variation></variation>

<line></line>

<content>

</content>`;

// --- METADATI: frecce ed evidenziazioni disegnate a mano ---
//
// Oltre ai tag "di contenuto" sopra, un commento può contenere due tag di
// puro metadato — mai mostrati nel tab analysis, solo usati per ricordare
// cosa avevi disegnato a mano sulla scacchiera quando eri su questa mossa:
//
//   <arrows>e2e4;g1f3</arrows>       (coppie "dacasellaacasella", senza separatore interno)
//   <highlights>e4;f6</highlights>   (caselle, separate da ;)

/**
 * @param {String} raw
 * @returns {{from: String, to: String}[]}
 */
export function parseArrows(raw) {
    if (!raw) return [];
    const match = raw.match(/<arrows>([\s\S]*?)<\/arrows>/i);
    if (!match || !match[1].trim()) return [];
    return match[1].trim().split(';').filter(Boolean).map(pair => ({
        from: pair.slice(0, 2),
        to: pair.slice(2, 4),
    }));
}

/**
 * @param {String} raw
 * @returns {String[]}
 */
export function parseHighlights(raw) {
    if (!raw) return [];
    const match = raw.match(/<highlights>([\s\S]*?)<\/highlights>/i);
    if (!match || !match[1].trim()) return [];
    return match[1].trim().split(';').filter(Boolean);
}

/**
 * Aggiorna (o aggiunge, se assenti) i tag <arrows>/<highlights> dentro un
 * commento grezzo, lasciando invariato tutto il resto (opening/variation/
 * line/content, ed eventuali altri tag già presenti).
 *
 * @param {String} raw
 * @param {{from: String, to: String}[]} arrows
 * @param {String[]} highlights
 * @returns {String}
 */
export function saveArrowsAndHighlights(raw, arrows, highlights) {
    const arrowsStr = arrows.map(a => `${a.from}${a.to}`).join(';');
    const highlightsStr = highlights.join(';');

    let updated = upsertTag(raw || '', 'arrows', arrowsStr);
    updated = upsertTag(updated, 'highlights', highlightsStr);
    return updated;
}

function upsertTag(raw, tag, content) {
    const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'i');
    const newTag = `<${tag}>${content}</${tag}>`;
    if (re.test(raw)) return raw.replace(re, newTag);
    return raw ? `${raw}\n${newTag}` : newTag;
}