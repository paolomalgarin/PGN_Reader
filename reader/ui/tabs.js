const TAB_IDS = ['analysis-tab', 'edit-tab', 'export-tab'];

/**
 * Collega i click sui pulsanti dei tab al relativo contenuto. I pulsanti e i
 * contenuti si trovano tramite i loro id (es. "analysis-tab" -> "#analysis"),
 * seguendo la stessa convenzione già usata nell'HTML.
 */
export function initTabs() {
    TAB_IDS.forEach(tabId => {
        const tabEl = document.getElementById(tabId);
        if (!tabEl) return;
        const contentId = tabId.replace(/-tab$/, '');
        tabEl.addEventListener('click', () => switchTab(tabId, contentId));
    });
}

/**
 * Mostra il contenuto richiesto ed evidenzia il tab corrispondente. Esportata
 * perché la modalità READ deve poter forzare il tab "analysis" anche se
 * l'utente aveva selezionato un altro tab prima di cambiare modalità.
 *
 * @param {String} tabId - es. 'analysis-tab'
 * @param {String} contentId - es. 'analysis'
 */
export function switchTab(tabId, contentId) {
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');

    const tabEl = document.getElementById(tabId);
    const contentEl = document.getElementById(contentId);
    if (tabEl) tabEl.classList.add('selected');
    if (contentEl) contentEl.style.display = 'flex';
}