import { DotIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link } from '@/i18n/navigation';

export default async function Breadcrumb4({ items = [] }) {
  const t = await getTranslations('Navigation');
  const segments = [{ label: t('home'), href: '/' }, ...items];

  return (
    <Breadcrumb className="min-w-0" aria-label={t('breadcrumb')}>
      <BreadcrumbList className="flex-nowrap gap-0 overflow-x-auto whitespace-nowrap pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:text-sm">
        {segments.map((segment, index) => (
          <Fragment key={`${segment.href || 'current'}-${segment.label}`}>
            <BreadcrumbItem className="min-w-0 gap-0">
              {segment.href && index < segments.length - 1 ? (
                <BreadcrumbLink
                  render={<Link href={segment.href} />}
                  className="rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground">
                  {segment.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="max-w-[14rem] truncate rounded-full bg-muted/70 px-2.5 py-1 font-medium sm:max-w-[24rem]">
                  {segment.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < segments.length - 1 ? (
              <BreadcrumbSeparator className="mx-0.5 shrink-0 text-muted-foreground/45">
                <DotIcon className="size-3" />
              </BreadcrumbSeparator>
            ) : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
