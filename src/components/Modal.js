const modalContainer = document.getElementById('modal-container');

export function showAmbiguityModal(result, onConfirm) {
  if (!modalContainer) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="label">[ AMBIGUITY DETECTED ]</h3>
      <p>System cannot determine media type for: <strong>${result.title || result.name}</strong></p>
      <div class="modal-actions">
        <button id="confirm-movie" class="cp-button">MOVIE</button>
        <button id="confirm-tv" class="cp-button">TV SHOW</button>
        <button id="modal-cancel" class="cp-button secondary">CANCEL</button>
      </div>
    </div>
  `;

  modalContainer.appendChild(modal);

  const cleanup = () => modal.remove();

  document.getElementById('confirm-movie').addEventListener('click', () => {
    onConfirm('movie');
    cleanup();
  });

  document.getElementById('confirm-tv').addEventListener('click', () => {
    onConfirm('tv');
    cleanup();
  });

  document.getElementById('modal-cancel').addEventListener('click', cleanup);
}
