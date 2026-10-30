'use client';

import { useActionState } from 'react';
import { saveBusinessProfileAction, type BusinessFormState } from './actions';
import type { BusinessConfig, BusinessProfile } from '@/lib/types/business';
import styles from './business.module.css';

const initialState: BusinessFormState = {};

interface ProfileFormProps {
  config: BusinessConfig;
  profile: BusinessProfile | null;
  /** The user's existing Markt accounts — onboarding only offers what's missing. */
  isBuyer: boolean;
  isSeller: boolean;
  onboarding?: boolean;
}

export function BusinessProfileForm({ config, profile, isBuyer, isSeller, onboarding = false }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveBusinessProfileAction, initialState);
  const selectedTypes = new Set(profile?.business_types ?? []);

  if (config.business_types.length === 0) {
    return (
      <div className={styles.notice + ' ' + styles.noticeWarning}>
        <p>Business settings couldn&apos;t be loaded right now. Refresh the page to try again.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      {onboarding && <input type="hidden" name="onboarding" value="1" />}

      {onboarding && (
        <fieldset className={styles.fieldset + ' ' + styles.card}>
          <legend className={styles.legend}>What does your business do on Markt?</legend>
          <div className={styles.grid2}>
            <label className={styles.choice}>
              <input type="checkbox" name="buys" defaultChecked={isBuyer} disabled={isBuyer} />
              <span>
                <p className={styles.choiceTitle}>We buy</p>
                <p className={styles.choiceText}>
                  Source raw materials, packaging or equipment and post procurement requests.
                  {isBuyer && ' Your buyer account is already set up.'}
                </p>
              </span>
            </label>
            <label className={styles.choice}>
              <input type="checkbox" name="sells" defaultChecked={isSeller} disabled={isSeller} />
              <span>
                <p className={styles.choiceTitle}>We sell</p>
                <p className={styles.choiceText}>
                  List what you produce or supply and respond to procurement requests.
                  {isSeller && ' Your seller account is already set up.'}
                </p>
              </span>
            </label>
          </div>
          {/* A disabled checkbox isn't submitted; these keep an existing
              account's box meaning "yes" without re-creating anything. */}
          {isBuyer && <input type="hidden" name="buys" value="on" />}
          {isSeller && <input type="hidden" name="sells" value="on" />}
        </fieldset>
      )}

      <fieldset className={styles.fieldset + ' ' + styles.card}>
        <legend className={styles.legend}>About the business</legend>
        <div className={styles.field}>
          <label htmlFor="name">Business name</label>
          <input id="name" name="name" className={styles.input} defaultValue={profile?.name ?? ''} required minLength={2} maxLength={150} />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            defaultValue={profile?.description ?? ''}
            maxLength={2000}
            placeholder="What you produce, buy or supply, and for whom."
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Business type</span>
          <p className={styles.hint}>Choose all that apply (up to 5).</p>
          <div className={styles.checkGrid}>
            {config.business_types.map((t) => (
              <label key={t.key} className={styles.check}>
                <input type="checkbox" name="business_types" value={t.key} defaultChecked={selectedTypes.has(t.key)} />
                {t.label}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="industry">Industry</label>
          <select id="industry" name="industry" className={styles.select} defaultValue={profile?.industry ?? ''}>
            <option value="">Choose an industry</option>
            {config.industries.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset + ' ' + styles.card}>
        <legend className={styles.legend}>Location</legend>
        <div className={styles.field}>
          <label htmlFor="address">Address</label>
          <input id="address" name="address" className={styles.input} defaultValue={profile?.address ?? ''} maxLength={255} />
        </div>
        <div className={styles.row3}>
          <div className={styles.field}>
            <label htmlFor="city">City / town</label>
            <input id="city" name="city" className={styles.input} defaultValue={profile?.city ?? ''} maxLength={100} />
          </div>
          <div className={styles.field}>
            <label htmlFor="state">State</label>
            <input id="state" name="state" className={styles.input} defaultValue={profile?.state ?? ''} maxLength={100} />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">Country</label>
            <input id="country" name="country" className={styles.input} defaultValue={profile?.country ?? 'Nigeria'} maxLength={100} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset + ' ' + styles.card}>
        <legend className={styles.legend}>Contact and registration</legend>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="contact_email">Business email</label>
            <input id="contact_email" name="contact_email" type="email" className={styles.input} defaultValue={profile?.contact_email ?? ''} />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact_phone">Business phone</label>
            <input id="contact_phone" name="contact_phone" type="tel" className={styles.input} defaultValue={profile?.contact_phone ?? ''} maxLength={20} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="website">Website (optional)</label>
            <input id="website" name="website" className={styles.input} defaultValue={profile?.website ?? ''} placeholder="example.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor="registration_number">Registration number (optional)</label>
            <input
              id="registration_number"
              name="registration_number"
              className={styles.input}
              defaultValue={profile?.registration_number ?? ''}
              maxLength={50}
              placeholder="e.g. CAC RC number"
            />
            <p className={styles.hint}>Only you can see this. Adding it doesn&apos;t verify your business.</p>
          </div>
        </div>
      </fieldset>

      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Business profile saved.</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? 'Saving…' : onboarding ? 'Create business profile' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
