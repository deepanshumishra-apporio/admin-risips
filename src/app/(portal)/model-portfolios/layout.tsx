import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { hasPermission } from '@/lib/auth/session';

/** Every page under this section needs `portfolios.manage`. */
export default async function ModelPortfoliosLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  if (!(await hasPermission('portfolios.manage'))) {
    return (
      <>
        <PageHeader title="Model portfolios" />
        <NoAccess what="model portfolios" />
      </>
    );
  }
  return <>{children}</>;
}
