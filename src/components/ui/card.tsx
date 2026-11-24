import type { ComponentProps } from 'react';

// Source-owned card primitive in the shadcn/ui pattern.
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={['panel', className].filter(Boolean).join(' ')} {...props} />;
}
