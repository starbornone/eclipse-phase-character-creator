type EgoSection = 'edit' | 'resleeve' | 'print';

export function egoPath(id: string, section?: EgoSection) {
  return `/egos/${encodeURIComponent(id)}${section ? `/${section}` : ''}`;
}
