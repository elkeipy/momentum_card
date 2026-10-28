import React from 'react';
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  REFRESH_SEC_MAX,
  REFRESH_SEC_MIN,
  type DisplaySettings
} from '../featureCard/cardSettings';
import OptionField from './OptionField';

type DisplaySettingsFieldsProps = {
  value: DisplaySettings;
  onChange: (value: DisplaySettings) => void;
  showRefresh?: boolean;
};

export default function DisplaySettingsFields({
  value,
  onChange,
  showRefresh = false
}: DisplaySettingsFieldsProps) {
  return (
    <>
      {showRefresh ? (
        <OptionField
          id="refreshSec"
          label="Refresh (sec)"
          min={REFRESH_SEC_MIN}
          max={REFRESH_SEC_MAX}
          value={value.refreshSec}
          onValue={refreshSec => onChange({...value, refreshSec})}
        />
      ) : null}
      <OptionField
        id="fontSize"
        label="Font Size"
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        value={value.fontSize}
        onValue={fontSize => onChange({...value, fontSize})}
      />
    </>
  );
}
