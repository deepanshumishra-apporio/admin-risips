'use client';

import { Trash2 } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/features/auth/components/form-parts';
import { deleteRole, type RoleFormState } from '@/features/roles/actions';

const Initial: RoleFormState = { error: null };

/** Two clicks, so a role isn't deleted by a stray one. Only offered when nobody holds the role. */
export function DeleteRole({ roleKey, name }: { roleKey: string; name: string }): React.JSX.Element {
  const [state, action, pending] = useActionState(deleteRole, Initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="key" value={roleKey} />
      <FormError message={state.error} />
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-soft">Delete “{name}”? This can’t be undone.</span>
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending ? 'Deleting…' : 'Delete role'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirming(true)} className="gap-1.5 text-danger">
          Delete role
        </Button>
      )}
    </form>
  );
}
