import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const SITE_URL = 'https://alpha-coach-pi.vercel.app';

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const allItems: BreadcrumbItem[] = [{ name: 'Home', path: '/' }, ...items];

  // Schema.org BreadcrumbList
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`
    }))
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>

      <ol className="flex items-center flex-wrap gap-2 text-xs text-content-muted">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-content-subtle" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="font-semibold text-content-primary" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-content-primary transition flex items-center gap-1.5"
                >
                  {idx === 0 && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
