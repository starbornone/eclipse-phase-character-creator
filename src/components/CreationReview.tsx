import type { CreationReviewIssue } from '../rules/calculations/creation-review.ts';
import { Card } from './ui/card.tsx';

export function CreationReview({ issues }: { issues: readonly CreationReviewIssue[] }) {
  const groups = [
    { title: 'Fix before saving', items: issues.filter(({ severity }) => severity === 'input') },
    { title: 'Review before play', items: issues.filter(({ severity }) => severity === 'review') },
  ];

  return (
    <Card className="editor-panel creation-review" role="region" aria-labelledby="creation-review-title">
      <h2 id="creation-review-title">Creation review</h2>
      <p className="muted" role="status">{issues.length
        ? `${issues.length} ${issues.length === 1 ? 'item' : 'items'} to review.` : 'The supported creation checks passed.'}</p>
      {groups.map(({ title, items }) => items.length > 0 && (
        <div key={title}>
          <h3>{title}</h3>
          <ul>
            {items.map(({ id, target, message }) => (
              <li key={id}>
                <a href={`#${target}`} onClick={(event) => {
                  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
                  const field = document.getElementById(target);
                  if (!field) return;
                  event.preventDefault();
                  field.focus({ preventScroll: true });
                  field.scrollIntoView({ block: 'nearest' });
                }}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}
