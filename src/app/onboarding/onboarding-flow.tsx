'use client';

import { useActionState, useState } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag, Store, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { completeBuyerAction, completeSellerAction, type OnboardingState } from './actions';
import type { OnboardingStep } from '@/lib/types/user';
import styles from './onboarding.module.css';

const initialState: OnboardingState = {};

interface Category {
  id: number;
  name: string;
}

type Role = 'buyer' | 'seller';

export function OnboardingFlow({
  step,
  username,
  hasBuyer,
  hasSeller,
  categories,
}: {
  step: Exclude<OnboardingStep, null>;
  username: string;
  hasBuyer: boolean;
  hasSeller: boolean;
  categories: Category[];
}) {
  // For a role-completion step the role is fixed; for choose_role the user picks.
  const fixedRole: Role | null = step === 'buyer_profile' ? 'buyer' : step === 'seller_profile' ? 'seller' : null;
  const [role, setRole] = useState<Role | null>(fixedRole);

  const choosing = step === 'choose_role';
  const onStep = choosing && role === null ? 1 : 2;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/markt-text-logo.png" alt="Markt" />
        </div>

        {choosing && (
          <div className={styles.progress} aria-hidden="true">
            <span className={cn(styles.pip, onStep >= 1 && styles.pipDone)} />
            <span className={cn(styles.pip, onStep >= 2 && styles.pipActive)} />
          </div>
        )}

        {role === null ? (
          <RoleChoice onPick={setRole} />
        ) : role === 'buyer' ? (
          <BuyerStep username={username} hasBuyer={hasBuyer} canGoBack={choosing} onBack={() => setRole(null)} />
        ) : (
          <SellerStep
            username={username}
            hasSeller={hasSeller}
            categories={categories}
            canGoBack={choosing}
            onBack={() => setRole(null)}
          />
        )}
      </div>
    </div>
  );
}

function RoleChoice({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <>
      <h1 className={styles.title}>How do you want to start?</h1>
      <p className={styles.lede}>You can always add the other side later — one account does both.</p>

      <div className={styles.roleGrid}>
        <button type="button" className={styles.roleCard} onClick={() => onPick('buyer')}>
          <span className={styles.roleIcon}>
            <ShoppingBag size={22} />
          </span>
          <span className={styles.roleName}>I’m here to buy</span>
          <span className={styles.roleDesc}>Discover local sellers, follow shops, and check out.</span>
          <ArrowRight size={16} className={styles.roleArrow} />
        </button>

        <button type="button" className={styles.roleCard} onClick={() => onPick('seller')}>
          <span className={styles.roleIcon}>
            <Store size={22} />
          </span>
          <span className={styles.roleName}>I’m here to sell</span>
          <span className={styles.roleDesc}>List products, manage a shop, and reach nearby buyers.</span>
          <ArrowRight size={16} className={styles.roleArrow} />
        </button>
      </div>
    </>
  );
}

function BuyerStep({
  username,
  hasBuyer,
  canGoBack,
  onBack,
}: {
  username: string;
  hasBuyer: boolean;
  canGoBack: boolean;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState(completeBuyerAction, initialState);

  return (
    <form action={formAction}>
      {canGoBack && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <ArrowLeft size={14} /> Change
        </button>
      )}
      <h1 className={styles.title}>Set up your buyer profile</h1>
      <p className={styles.lede}>This is the name sellers see on your orders and messages.</p>

      <input type="hidden" name="has_buyer" value={hasBuyer ? '1' : '0'} />
      <div className={styles.field}>
        <label htmlFor="buyername">Display name</label>
        <input
          id="buyername"
          name="buyername"
          className={styles.input}
          defaultValue={username}
          placeholder="How sellers see you"
          autoFocus
          required
        />
      </div>

      {state.error && <p className={styles.error}>{state.error}</p>}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? 'Finishing…' : (<>Enter Markt <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
}

function SellerStep({
  username,
  hasSeller,
  categories,
  canGoBack,
  onBack,
}: {
  username: string;
  hasSeller: boolean;
  categories: Category[];
  canGoBack: boolean;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState(completeSellerAction, initialState);

  return (
    <form action={formAction}>
      {canGoBack && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          <ArrowLeft size={14} /> Change
        </button>
      )}
      <h1 className={styles.title}>Set up your shop</h1>
      <p className={styles.lede}>Just the basics to get you selling — you can refine it all later.</p>

      <input type="hidden" name="has_seller" value={hasSeller ? '1' : '0'} />
      <div className={styles.field}>
        <label htmlFor="shop_name">Shop name</label>
        <input
          id="shop_name"
          name="shop_name"
          className={styles.input}
          defaultValue={`${username}'s Shop`}
          placeholder="Your shop’s name"
          autoFocus
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">What do you sell?</label>
        <input
          id="description"
          name="description"
          className={styles.input}
          placeholder="e.g. Handmade ceramics and homeware"
          required
        />
      </div>

      {!hasSeller && categories.length > 0 && (
        <div className={styles.field}>
          <label>Categories — pick at least one</label>
          <div className={styles.chipGrid}>
            {categories.map((cat) => (
              <label key={cat.id} className={styles.chip}>
                <input type="checkbox" name="category_ids" value={cat.id} />
                <Check size={13} className={styles.chipCheck} />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {state.error && <p className={styles.error}>{state.error}</p>}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? 'Finishing…' : (<>Open my shop <ArrowRight size={16} /></>)}
      </button>
    </form>
  );
}
