import { Fragment } from "react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  /** Optional. Omit on the last item (current page) so it renders as plain text. */
  to?: string;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Compact text breadcrumbs for admin subpages. Linked crumbs hint with a
 * gold hover color (matches the link affordance used elsewhere). The
 * separator "›" is rendered at reduced opacity so the labels dominate.
 *
 * Current-page crumb (the last item with no `to`) is read by AT as a
 * page label via aria-current.
 */
export function Breadcrumbs({ items, className }: Props) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={["font-label text-[0.7rem] tracking-[0.22em]", className ?? ""].join(" ")}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-[--color-cream]/55">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="text-[--color-cream]/55 transition hover:text-[--color-gold-300]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "text-[--color-cream]/90" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden className="text-[--color-cream]/30">
                  ›
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
