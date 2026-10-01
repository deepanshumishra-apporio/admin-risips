'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, SelectInput } from '@/components/ui/field';
import { Toggle } from '@/components/ui/toggle';
import { useSidebar } from '@/components/layout/sidebar-state';
import { DefaultWorkspacePreferences, LandingPages } from '@/data/profile';

const DateFormats = ['DD MMM YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

/** How the portal behaves for this admin. The sidebar row is wired to the real
 *  shell state, so toggling it here collapses the rail immediately. */
export function WorkspacePreferences(): React.JSX.Element {
  const { collapsed, toggle } = useSidebar();
  const [landingPage, setLandingPage] = useState(DefaultWorkspacePreferences.landingPage);
  const [dateFormat, setDateFormat] = useState(DefaultWorkspacePreferences.dateFormat);
  const [density, setDensity] = useState(DefaultWorkspacePreferences.density);

  return (
    <Card>
      <CardHeader title="Workspace" subtitle="Applies to your account on this device." />
      <CardBody className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Landing page" hint="Where signing in takes you.">
            <SelectInput value={landingPage} onChange={(event) => setLandingPage(event.target.value)}>
              {LandingPages.map((page) => (
                <option key={page.value} value={page.value}>
                  {page.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Date format">
            <SelectInput value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}>
              {DateFormats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Table density">
            <SelectInput
              value={density}
              onChange={(event) => setDensity(event.target.value as typeof density)}
            >
              {(['Comfortable', 'Compact'] as const).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="text-[13.5px] font-medium text-ink">Start with the sidebar collapsed</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Keeps the navigation as an icon rail. You can also toggle it with Ctrl B.
            </p>
          </div>
          <Toggle checked={collapsed} onChange={() => toggle()} label="Start with the sidebar collapsed" />
        </div>
      </CardBody>
    </Card>
  );
}
