import React, {useEffect, useState} from 'react';
import {CLOCK_FONT_DEFAULT, REFRESH_SEC_DEFAULT} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {localeOf, useLang, useT} from '../i18n/i18n';
import styles from '../css/Clock.module.css';
import DisplaySettingsFields from './DisplaySettingsFields';
import SettingsModal from './SettingsModal';

const CLOCK_TIMEOUT_MS = 1000;
const CLOCK_DEFAULTS = {
  fontSize: CLOCK_FONT_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};

function Clock() {
  const settings = useDisplaySettings('clock', CLOCK_DEFAULTS);
  const lang = useLang();
  const t = useT();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, CLOCK_TIMEOUT_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.rootDiv}>
      <p
        className={`${styles.time} num`}
        style={{fontSize: `${settings.shown.fontSize}px`}}
      >
        {now.toLocaleTimeString(localeOf(lang))}
      </p>
      {settings.isOpen ? (
        <SettingsModal title={t('settings.clock')} onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
        </SettingsModal>
      ) : null}
    </div>
  );
}

export default Clock;
