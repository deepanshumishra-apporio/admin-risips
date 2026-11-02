'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { saveHuf, type HufFormState } from '@/features/hufs/actions';
import type { HufDetailsInput, HufOptions } from '@/types/admin-api.types';

const Initial: HufFormState = { error: null };

function Err({ fields, name }: { fields: Record<string, string> | undefined; name: string }): React.JSX.Element | null {
  const message = fields?.[name];
  return message ? <span className="mt-1 block text-[12px] text-danger">{message}</span> : null;
}

type HufFormProps = {
  /** Present when editing a draft. */
  id?: string;
  initial: HufDetailsInput | null;
  options: HufOptions;
};

/**
 * Everything NSE needs to register a HUF. Saving keeps it as a draft: nothing
 * goes to NSE until the karta has consented and a colleague approves.
 */
export function HufForm({ id, initial, options }: HufFormProps): React.JSX.Element {
  const [state, action] = useActionState(saveHuf, Initial);
  // Remounted from what was submitted after each failed save, so nothing typed is lost.
  return <Fields key={state.attempt ?? 0} id={id} initial={state.values ?? initial} options={options} state={state} action={action} />;
}

type FieldsProps = HufFormProps & { state: HufFormState; action: (form: FormData) => void };

function Fields({ id, initial, options, state, action }: FieldsProps): React.JSX.Element {
  const f = state.fields;
  const d = initial;
  const confirm = state.values?.accountNoConfirm ?? d?.accountNo;
  const [coparceners, setCoparceners] = useState(
    d?.coparceners.length ? d.coparceners : [{ name: '', relationship: '', dateOfBirth: null as string | null }],
  );

  return (
    <form action={action} className="grid max-w-4xl gap-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormError message={state.error} />

      <Card>
        <CardHeader title="1. The HUF" subtitle="As on the HUF's own PAN card. The HUF is the investor; the karta acts for it." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="HUF name" hint="Ends in HUF, e.g. RAJESH KUMAR HUF" required>
            <TextInput name="hufName" defaultValue={d?.hufName} maxLength={70} required />
            <Err fields={f} name="hufName" />
          </Field>
          <Field label="HUF PAN" hint="The HUF's own PAN: H is the 4th character" required>
            <TextInput name="pan" defaultValue={d?.pan} maxLength={10} className="uppercase" required />
            <Err fields={f} name="pan" />
          </Field>
          <Field label="Date the HUF was formed" required>
            <TextInput type="date" name="formedOn" defaultValue={d?.formedOn} required />
            <Err fields={f} name="formedOn" />
          </Field>
          <Field label="Place it was formed (city)" required>
            <TextInput name="placeOfFormation" defaultValue={d?.placeOfFormation} maxLength={60} required />
            <Err fields={f} name="placeOfFormation" />
          </Field>
          <Field label="Nature of business" hint="e.g. BUSINESS, PHARMACY" required>
            <TextInput name="natureOfBusiness" defaultValue={d?.natureOfBusiness ?? 'BUSINESS'} maxLength={30} required />
            <Err fields={f} name="natureOfBusiness" />
          </Field>
          <Field label="NSE client code" hint="The HUF series: RSPH000001, RSPH000002 …" required>
            <TextInput name="clientCode" defaultValue={d?.clientCode ?? options.nextClientCode} maxLength={10} className="uppercase" required />
            <Err fields={f} name="clientCode" />
          </Field>
          <Field label="Income slab" required>
            <SelectInput name="incomeSlab" defaultValue={d?.incomeSlab ?? ''} required>
              <option value="" disabled>
                Choose…
              </option>
              {options.incomeSlabs.map((slab) => (
                <option key={slab.code} value={slab.code}>
                  {slab.label}
                </option>
              ))}
            </SelectInput>
            <Err fields={f} name="incomeSlab" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Net worth (₹ lakh)" required>
              <TextInput name="netWorthLakhs" defaultValue={d?.netWorthLakhs} inputMode="decimal" maxLength={16} required />
              <Err fields={f} name="netWorthLakhs" />
            </Field>
            <Field label="As on" required>
              <TextInput type="date" name="netWorthDate" defaultValue={d?.netWorthDate} required />
              <Err fields={f} name="netWorthDate" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="2. The karta" subtitle="Must be an adult. Sent to NSE as the HUF's beneficial owner." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Karta's name" required>
            <TextInput name="karta.name" defaultValue={d?.karta.name} maxLength={70} required />
            <Err fields={f} name="karta.name" />
          </Field>
          <Field label="Karta's personal PAN" hint="P is the 4th character" required>
            <TextInput name="karta.pan" defaultValue={d?.karta.pan} maxLength={10} className="uppercase" required />
            <Err fields={f} name="karta.pan" />
          </Field>
          <Field label="Karta's date of birth" required>
            <TextInput type="date" name="karta.dateOfBirth" defaultValue={d?.karta.dateOfBirth} required />
            <Err fields={f} name="karta.dateOfBirth" />
          </Field>
          <Field label="Karta's gender" required>
            <SelectInput name="karta.gender" defaultValue={d?.karta.gender ?? ''} required>
              <option value="" disabled>
                Choose…
              </option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </SelectInput>
            <Err fields={f} name="karta.gender" />
          </Field>
          <Field label="Karta's father's name">
            <TextInput name="karta.fatherName" defaultValue={d?.karta.fatherName} maxLength={50} />
          </Field>
          <span />
          <Field label="Karta's email" hint="NSE sends every authorisation link here" required>
            <TextInput type="email" name="email" defaultValue={d?.email} maxLength={100} required />
            <Err fields={f} name="email" />
          </Field>
          <Field label="Karta's mobile" hint="NSE sends every OTP here" required>
            <TextInput name="mobile" defaultValue={d?.mobile} inputMode="numeric" maxLength={10} required />
            <Err fields={f} name="mobile" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="3. Co-parceners" subtitle="The family members in the HUF, as on the HUF declaration. Kept on record; NSE has no field for them." />
        <CardBody className="space-y-3">
          {coparceners.map((member, index) => (
            <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_160px_auto]">
              <Field label="Name">
                <TextInput name={`coparceners.${index}.name`} defaultValue={member.name} maxLength={70} />
              </Field>
              <Field label="Relationship to the karta">
                <TextInput name={`coparceners.${index}.relationship`} defaultValue={member.relationship} maxLength={30} placeholder="e.g. WIFE, SON" />
              </Field>
              <Field label="Date of birth">
                <TextInput type="date" name={`coparceners.${index}.dateOfBirth`} defaultValue={member.dateOfBirth ?? ''} />
              </Field>
              <button
                type="button"
                aria-label={`Remove co-parcener ${index + 1}`}
                onClick={() => setCoparceners((list) => list.filter((_, i) => i !== index))}
                className="mb-0.5 inline-flex h-10 items-center rounded-md px-2 text-ink-muted hover:bg-surface-sunken hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
              <span className="sm:col-span-4">
                <Err fields={f} name={`coparceners.${index}`} />
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCoparceners((list) => [...list, { name: '', relationship: '', dateOfBirth: null }])}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-deep"
          >
            <Plus className="size-4" />
            Add a co-parcener
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="4. The HUF's bank account" subtitle="Must be in the HUF's name. NSE checks it, and every payment and payout uses only this account." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Account holder name, as the bank has it" required>
            <TextInput name="bankHolderName" defaultValue={d?.bankHolderName} maxLength={70} required />
            <Err fields={f} name="bankHolderName" />
          </Field>
          <Field label="Account type" required>
            <SelectInput name="accountType" defaultValue={d?.accountType ?? 'SB'}>
              <option value="SB">Savings</option>
              <option value="CB">Current</option>
            </SelectInput>
          </Field>
          <Field label="Account number" required>
            <TextInput name="accountNo" defaultValue={d?.accountNo} inputMode="numeric" maxLength={18} autoComplete="off" required />
            <Err fields={f} name="accountNo" />
          </Field>
          <Field label="Account number again" required>
            <TextInput name="accountNoConfirm" defaultValue={confirm} inputMode="numeric" maxLength={18} autoComplete="off" required />
            <Err fields={f} name="accountNoConfirm" />
          </Field>
          <Field label="IFSC" required>
            <TextInput name="ifsc" defaultValue={d?.ifsc} maxLength={11} className="uppercase" required />
            <Err fields={f} name="ifsc" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="5. Address" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1" required className="sm:col-span-2">
            <TextInput name="address1" defaultValue={d?.address1} maxLength={40} required />
            <Err fields={f} name="address1" />
          </Field>
          <Field label="Address line 2">
            <TextInput name="address2" defaultValue={d?.address2} maxLength={40} />
          </Field>
          <Field label="Address line 3">
            <TextInput name="address3" defaultValue={d?.address3} maxLength={40} />
          </Field>
          <Field label="City" required>
            <TextInput name="city" defaultValue={d?.city} maxLength={35} required />
            <Err fields={f} name="city" />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="State" required>
              <SelectInput name="state" defaultValue={d?.state ?? ''} required>
                <option value="" disabled>
                  Choose…
                </option>
                {options.states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </SelectInput>
              <Err fields={f} name="state" />
            </Field>
            <Field label="Pincode" required>
              <TextInput name="pincode" defaultValue={d?.pincode} inputMode="numeric" maxLength={6} required />
              <Err fields={f} name="pincode" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="max-w-xs">
        <SubmitButton>{id ? 'Save changes' : 'Save as draft'}</SubmitButton>
      </div>
    </form>
  );
}
