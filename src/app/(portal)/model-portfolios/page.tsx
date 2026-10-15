import { Plus } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { PortfolioLibrary } from '@/features/portfolios/components/portfolio-library';

export default function ModelPortfoliosPage(): React.JSX.Element {
  return (
    <>
      <PageHeader
        title="Model portfolios"
        description="Ready-made fund combinations curated per risk profile. Drafts are templates; publishing makes one live for agents and investors."
        actions={
          <Link
            href="/model-portfolios/new"
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            Add more
          </Link>
        }
      />
      <PortfolioLibrary />
    </>
  );
}
