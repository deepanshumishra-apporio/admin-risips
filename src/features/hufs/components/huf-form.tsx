'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { saveHuf, type HufFormState } from '@/features/hufs/actions';
import type { CompanyOwner, EntityType, HufDetailsInput, HufOptions } from '@/types/admin-api.types';

const Initial: HufFormState = { error: null };
/** NSE's FATCA takes at most 4 beneficial owners ("Maximum 4 UBO records are allowed."). */
const MaxOwners = 4;
const blankOwner = (): CompanyOwner => ({ name: '', pan: '', dateOfBirth: '', gender: '', fatherName: '', category: 'UBO', holdingPct: '', designation: '' });

function Err({ fields, name }: { fields: Record<string, string> | undefined; name: string }): React.JSX.Element | null {
  const message = fields?.[name];
  return message ? <span className="mt-1 block text-[12px] text-danger">{message}</span> : null;
}

type HufFormProps = {
  /** Present when editing a draft. */
  id?: string;
  initial: HufDetailsInput | null;
  /** For a new record; an existing one keeps its own type. */
  entityType?: EntityType;
  options: HufOptions;
};

/**
 * Everything NSE needs to register a HUF or a company. Saving keeps it as a draft: nothing goes to NSE until the
 * karta (or the company's authorised signatory) has consented and a colleague approves.
 */
export function HufForm({ id, initial, entityType, options }: HufFormProps): React.JSX.Element {
  const [state, action] = useActionState(saveHuf, Initial);
  // Remounted from what was submitted after each failed save, so nothing typed is lost.
  return (
    <Fields key={state.attempt ?? 0} id={id} initial={state.values ?? initial} entityType={entityType} options={options} state={state} action={action} />
  );
}

type FieldsProps = HufFormProps & { state: HufFormState; action: (form: FormData) => void };

function Fields({ id, initial, entityType, options, state, action }: FieldsProps): React.JSX.Element {
  const f = state.fields;
  const d = initial;
  const company = (d?.entityType ?? entityType ?? 'HUF') === 'COMPANY';
  const word = company ? 'company' : 'HUF';
  const who = company ? 'signatory' : 'karta';
  const Who = company ? 'Signatory' : 'Karta';
  const confirm = state.values?.accountNoConfirm ?? d?.accountNo;
  const [coparceners, setCoparceners] = useState(
    d?.coparceners.length ? d.coparceners : [{ name: '', relationship: '', dateOfBirth: null as string | null }],
  );
  const [owners, setOwners] = useState<CompanyOwner[]>(d?.owners?.length ? d.owners : [blankOwner()]);
  const [listed, setListed] = useState(Boolean(d?.listed));
  const maxOwners = options.maxOwners ?? MaxOwners;
  const defaultCode = options.nextClientCodes?.[company ? 'COMPANY' : 'HUF'] ?? options.nextClientCode;

  return (
    <form action={action} className="grid max-w-4xl gap-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="entityType" value={company ? 'COMPANY' : 'HUF'} />
      <FormError message={state.error} />

      <Card>
        <CardHeader
          title={company ? '1. The company' : '1. The HUF'}
          subtitle={
            company
              ? "As on the company's own PAN card. The company is the investor; its authorised signatory acts for it."
              : "As on the HUF's own PAN card. The HUF is the investor; the karta acts for it."
          }
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={company ? 'Registered name' : 'HUF name'} hint={company ? 'e.g. TESTCO PRIVATE LIMITED' : 'Ends in HUF, e.g. RAJESH KUMAR HUF'} required>
            <TextInput name="hufName" defaultValue={d?.hufName} maxLength={70} required />
            <Err fields={f} name="hufName" />
          </Field>
          <Field label={company ? 'Company PAN' : 'HUF PAN'} hint={company ? "The company's own PAN: C is the 4th character" : "The HUF's own PAN: H is the 4th character"} required>
            <TextInput name="pan" defaultValue={d?.pan} maxLength={10} className="uppercase" required />
            <Err fields={f} name="pan" />
          </Field>
          <Field label={company ? 'Date of incorporation' : 'Date the HUF was formed'} required>
            <TextInput type="date" name="formedOn" defaultValue={d?.formedOn} required />
            <Err fields={f} name="formedOn" />
          </Field>
          <Field label={company ? 'Place of incorporation (city)' : 'Place it was formed (city)'} required>
            <TextInput name="placeOfFormation" defaultValue={d?.placeOfFormation} maxLength={60} required />
            <Err fields={f} name="placeOfFormation" />
          </Field>
          {company ? (
            <Field label="CIN" hint="Corporate Identification Number, kept on record (NSE has no field for it)">
              <TextInput name="cin" defaultValue={d?.cin} maxLength={21} className="uppercase" />
              <Err fields={f} name="cin" />
            </Field>
          ) : null}
          <Field label="Nature of business" hint={company ? 'e.g. SOFTWARE SERVICES, MANUFACTURING' : 'e.g. BUSINESS, PHARMACY'} required>
            <TextInput name="natureOfBusiness" defaultValue={d?.natureOfBusiness ?? 'BUSINESS'} maxLength={30} required />
            <Err fields={f} name="natureOfBusiness" />
          </Field>
          <Field label="NSE client code" hint={company ? 'The company series: RSPC000001, RSPC000002 …' : 'The HUF series: RSPH000001, RSPH000002 …'} required>
            <TextInput name="clientCode" defaultValue={d?.clientCode ?? defaultCode} maxLength={10} className="uppercase" required />
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
        <CardHeader
          title={company ? '2. The authorised signatory' : '2. The karta'}
          subtitle={
            company
              ? 'The person the board authorised to act for the company. They give consent, and NSE sends them every link and OTP.'
              : "Must be an adult. Sent to NSE as the HUF's beneficial owner."
          }
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={`${Who}'s name`} required>
            <TextInput name="karta.name" defaultValue={d?.karta.name} maxLength={70} required />
            <Err fields={f} name="karta.name" />
          </Field>
          <Field label={`${Who}'s personal PAN`} hint="P is the 4th character" required>
            <TextInput name="karta.pan" defaultValue={d?.karta.pan} maxLength={10} className="uppercase" required />
            <Err fields={f} name="karta.pan" />
          </Field>
          <Field label={`${Who}'s date of birth`} required>
            <TextInput type="date" name="karta.dateOfBirth" defaultValue={d?.karta.dateOfBirth} required />
            <Err fields={f} name="karta.dateOfBirth" />
          </Field>
          <Field label={`${Who}'s gender`} required>
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
          <Field label={`${Who}'s father's name`}>
            <TextInput name="karta.fatherName" defaultValue={d?.karta.fatherName} maxLength={50} />
          </Field>
          {company ? (
            <Field label="Designation" hint="e.g. DIRECTOR, COMPANY SECRETARY" required>
              <TextInput name="signatoryDesignation" defaultValue={d?.signatoryDesignation} maxLength={40} required />
              <Err fields={f} name="signatoryDesignation" />
            </Field>
          ) : (
            <span />
          )}
          <Field label={`${Who}'s email`} hint="NSE sends every authorisation link here" required>
            <TextInput type="email" name="email" defaultValue={d?.email} maxLength={100} required />
            <Err fields={f} name="email" />
          </Field>
          <Field label={`${Who}'s mobile`} hint="NSE sends every OTP here" required>
            <TextInput name="mobile" defaultValue={d?.mobile} inputMode="numeric" maxLength={10} required />
            <Err fields={f} name="mobile" />
          </Field>
        </CardBody>
      </Card>

      {company ? (
        <Card>
          <CardHeader
            title="3. Beneficial owners"
            subtitle={`Everyone who owns or controls more than 10% of the company, up to ${maxOwners} (NSE's limit). If no one does, declare the senior managing official instead. Sent to NSE in the FATCA declaration.`}
          />
          <CardBody className="space-y-4">
            <label className="flex items-start gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" name="listed.on" checked={listed} onChange={(e) => setListed(e.target.checked)} className="mt-0.5" />
              <span>
                The company is listed on a stock exchange, or is a subsidiary or associate of a listed company. Then no owners are declared: NSE
                takes the exchange and ISIN instead.
              </span>
            </label>
            {listed ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Exchange" required>
                  <SelectInput name="listed.exchange" defaultValue={d?.listed?.exchange ?? 'N'}>
                    <option value="N">NSE</option>
                    <option value="B">BSE</option>
                  </SelectInput>
                </Field>
                <Field label="ISIN of the listed company" hint="e.g. INE002A01018" required>
                  <TextInput name="listed.isin" defaultValue={d?.listed?.isin} maxLength={12} className="uppercase" required />
                  <Err fields={f} name="listed.isin" />
                </Field>
              </div>
            ) : (
              <>
                <Err fields={f} name="owners" />
                {owners.map((o, index) => (
                  <OwnerRow
                    key={index}
                    index={index}
                    owner={o}
                    fields={f}
                    onCategory={(category) => setOwners((list) => list.map((x, i) => (i === index ? { ...x, category } : x)))}
                    onRemove={owners.length > 1 ? () => setOwners((list) => list.filter((_, i) => i !== index)) : null}
                  />
                ))}
                {owners.length < maxOwners ? (
                  <button
                    type="button"
                    onClick={() => setOwners((list) => [...list, blankOwner()])}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-deep"
                  >
                    <Plus className="size-4" />
                    Add an owner
                  </button>
                ) : (
                  <p className="text-[12px] text-ink-muted">NSE takes at most {maxOwners} beneficial owners.</p>
                )}
              </>
            )}
          </CardBody>
        </Card>
      ) : (
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
      )}

      <Card>
        <CardHeader
          title={`4. The ${word}'s bank account`}
          subtitle={
            company
              ? "A current account in the company's name. NSE checks it, and every payment and payout uses only this account."
              : "Must be in the HUF's name. NSE checks it, and every payment and payout uses only this account."
          }
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Account holder name, as the bank has it" required>
            <TextInput name="bankHolderName" defaultValue={d?.bankHolderName} maxLength={70} required />
            <Err fields={f} name="bankHolderName" />
          </Field>
          <Field label="Account type" required>
            {company ? (
              <>
                <input type="hidden" name="accountType" value="CB" />
                <TextInput value="Current" readOnly disabled />
              </>
            ) : (
              <SelectInput name="accountType" defaultValue={d?.accountType ?? 'SB'}>
                <option value="SB">Savings</option>
                <option value="CB">Current</option>
              </SelectInput>
            )}
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
        <CardHeader title={company ? '5. Registered office address' : '5. Address'} />
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

      <p className="text-[12px] text-ink-muted">
        Nothing goes to NSE until the {who} has consented on the link you send them and a colleague approves.
      </p>
      <div className="max-w-xs">
        <SubmitButton>{id ? 'Save changes' : 'Save as draft'}</SubmitButton>
      </div>
    </form>
  );
}

type OwnerRowProps = {
  index: number;
  owner: CompanyOwner;
  fields: Record<string, string> | undefined;
  onCategory: (category: CompanyOwner['category']) => void;
  onRemove: (() => void) | null;
};

/** One beneficial owner: a shareholder above 10% (with holding), or the senior managing official (with designation). */
function OwnerRow({ index, owner, fields, onCategory, onRemove }: OwnerRowProps): React.JSX.Element {
  const at = `owners.${index}`;
  const smo = owner.category === 'SMO';
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Owner {index + 1}</p>
        {onRemove ? (
          <button
            type="button"
            aria-label={`Remove owner ${index + 1}`}
            onClick={onRemove}
            className="inline-flex h-8 items-center rounded-md px-2 text-ink-muted hover:bg-surface-sunken hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Who they are" required>
          <SelectInput name={`${at}.category`} value={owner.category} onChange={(e) => onCategory(e.target.value === 'SMO' ? 'SMO' : 'UBO')}>
            <option value="UBO">Owns or controls more than 10%</option>
            <option value="SMO">Senior managing official (no one above 10%)</option>
          </SelectInput>
        </Field>
        {smo ? (
          <Field label="Designation" hint="e.g. MANAGING DIRECTOR" required>
            <TextInput name={`${at}.designation`} defaultValue={owner.designation} maxLength={40} required />
            <Err fields={fields} name={`${at}.designation`} />
          </Field>
        ) : (
          <Field label="Holding (%)" required>
            <TextInput name={`${at}.holdingPct`} defaultValue={owner.holdingPct} inputMode="decimal" maxLength={6} required />
            <Err fields={fields} name={`${at}.holdingPct`} />
          </Field>
        )}
        <Field label="Name" required>
          <TextInput name={`${at}.name`} defaultValue={owner.name} maxLength={70} required />
          <Err fields={fields} name={`${at}.name`} />
        </Field>
        <Field label="Personal PAN" hint="P is the 4th character" required>
          <TextInput name={`${at}.pan`} defaultValue={owner.pan} maxLength={10} className="uppercase" required />
          <Err fields={fields} name={`${at}.pan`} />
        </Field>
        <Field label="Date of birth" required>
          <TextInput type="date" name={`${at}.dateOfBirth`} defaultValue={owner.dateOfBirth} required />
          <Err fields={fields} name={`${at}.dateOfBirth`} />
        </Field>
        <Field label="Gender" required>
          <SelectInput name={`${at}.gender`} defaultValue={owner.gender} required>
            <option value="" disabled>
              Choose…
            </option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </SelectInput>
          <Err fields={fields} name={`${at}.gender`} />
        </Field>
        <Field label="Father's name" hint="As on their PAN" required>
          <TextInput name={`${at}.fatherName`} defaultValue={owner.fatherName} maxLength={50} required />
          <Err fields={fields} name={`${at}.fatherName`} />
        </Field>
      </div>
    </div>
  );
}
