export function IndexersPanel(indexers = []) {
  if (indexers.length === 0) {
    return `<div class="empty-state">NO_INDEXERS_FOUND_</div>`;
  }

  return `
    <div class="panel-content">
      <table class="pixel-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>PROTOCOL</th>
            <th>ENABLED</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${indexers.map(idx => {
            const isError = !idx.enable || idx.status !== 'OK';
            return `
              <tr class="${isError ? 'row-error' : ''}">
                <td>${idx.name}</td>
                <td>${idx.protocol?.toUpperCase() || '??'}</td>
                <td>${idx.enable ? 'YES' : 'NO'}</td>
                <td>${idx.enable ? 'ONLINE' : 'DISABLED'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}
