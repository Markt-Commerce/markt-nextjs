'use client';

import './toggle-switch.css';

export interface ToggleSwitchProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Ported from markt_angular shared/components/toggle-switch/toggle-switch.component.ts. */
export function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel }: ToggleSwitchProps) {
  // Coerce to a real boolean so the input is controlled from the first render.
  // If a caller ever passes undefined (e.g. a preference key missing from a
  // partially-stored settings blob), React would otherwise warn that the input
  // flipped from uncontrolled to controlled once the value resolves.
  const isOn = !!checked;

  return (
    <label className={disabled ? 'toggle-switch-container disabled' : 'toggle-switch-container'}>
      <input
        type="checkbox"
        checked={isOn}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-switch-input"
        aria-label={ariaLabel}
      />
      <span className={isOn ? 'toggle-switch-slider checked' : 'toggle-switch-slider'} />
    </label>
  );
}
