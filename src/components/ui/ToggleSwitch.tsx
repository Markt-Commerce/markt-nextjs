'use client';

import './toggle-switch.css';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Ported from markt_angular shared/components/toggle-switch/toggle-switch.component.ts. */
export function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
  return (
    <label className={disabled ? 'toggle-switch-container disabled' : 'toggle-switch-container'}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-switch-input"
        aria-label={ariaLabel}
      />
      <span className={checked ? 'toggle-switch-slider checked' : 'toggle-switch-slider'} />
    </label>
  );
}
