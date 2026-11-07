import Sortable from 'sortablejs';

function setup(container, status) {
  const abort = new AbortController();
  const rows = () => [...container.querySelectorAll(':scope > [data-field-row]')];
  const label = row => row.querySelector('[data-property="label"]').value.trim() || 'Unbenanntes Feld';
  function refresh(moved) {
    const fields = rows();
    fields.forEach((row, index) => {
      row.querySelector('[data-field-position]').textContent = `Feld ${index + 1}`;
      row.querySelector('[data-field-drag]').setAttribute('aria-label', `Feld ${index + 1}: ${label(row)} verschieben`);
      for (const [direction, text] of [[-1, 'oben'], [1, 'unten']]) {
        const button = row.querySelector(`[data-field-move="${direction}"]`);
        button.disabled = direction === -1 ? index === 0 : index === fields.length - 1;
        button.setAttribute('aria-label', `Feld ${index + 1}: ${label(row)} nach ${text}`);
      }
    });
    if (moved) status.textContent = `${label(moved)} steht jetzt an Position ${fields.indexOf(moved) + 1} von ${fields.length}.`;
  }
  function move(row, direction, focus) {
    const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    if (direction < 0) container.insertBefore(row, sibling);
    else container.insertBefore(sibling, row);
    refresh(row);
    if (focus.disabled) focus = row.querySelector(`[data-field-move="${-direction}"]`);
    focus.focus({ preventScroll: true });
    row.scrollIntoView({ block: 'nearest' });
  }
  container.addEventListener('click', event => {
    const button = event.target.closest('button');
    const row = button?.closest('[data-field-row]');
    if (!row) return;
    if (button.hasAttribute('data-remove-field')) {
      const focusRow = row.nextElementSibling || row.previousElementSibling;
      const name = label(row);
      row.remove(); refresh(); status.textContent = `${name} wurde entfernt.`;
      (focusRow?.querySelector('[data-field-drag]') || document.getElementById('add-field')).focus({ preventScroll: true });
    } else if (button.hasAttribute('data-field-move')) {
      move(row, Number(button.dataset.fieldMove), button);
    }
  }, { signal: abort.signal });
  container.addEventListener('input', () => refresh(), { signal: abort.signal });
  container.addEventListener('keydown', event => {
    const handle = event.target.closest('[data-field-drag]');
    if (!handle || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); move(handle.closest('[data-field-row]'), event.key === 'ArrowUp' ? -1 : 1, handle);
  }, { signal: abort.signal });
  const sortable = Sortable.create(container, {
    handle: '[data-field-drag]', draggable: '[data-field-row]', direction: 'vertical',
    animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
    ghostClass: 'field-sort-ghost', chosenClass: 'field-sort-chosen', dragClass: 'field-sort-drag',
    fallbackTolerance: 5, delayOnTouchOnly: true, delay: 150, touchStartThreshold: 4,
    onEnd(event) {
      if (event.oldIndex !== event.newIndex) refresh(event.item);
      event.item.querySelector('[data-field-drag]').focus({ preventScroll: true });
    }
  });
  refresh();
  return { refresh, destroy() { abort.abort(); sortable.destroy(); } };
}
window.FieldSorter = { setup };
