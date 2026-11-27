type EgoSection = 'edit' | 'resleeve' | 'print';

export function egoPath(id: string, section?: EgoSection) {
  return `/egos/${encodeURIComponent(id)}${section ? `/${section}` : ''}`;
}

export function morphSelectionPath(path: string, morphId: string) {
  return `${path}?${new URLSearchParams({ morph: morphId })}`;
}
