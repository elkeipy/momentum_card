import React, {useEffect, useState} from 'react';
import {
  FONT_SIZE_DEFAULT,
  REFRESH_SEC_DEFAULT
} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import {useLang, useT} from '../i18n/i18n';
import {nextQuoteIndex, QUOTES} from '../quotes/quotes';
import DisplaySettingsFields from './DisplaySettingsFields';
import RemainBar from './RemainBar';
import SettingsModal from './SettingsModal';
import styles from './QuoteCard.module.css';

const QUOTE_DEFAULTS = {
  fontSize: FONT_SIZE_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};

export default function QuoteCard() {
  const settings = useDisplaySettings('quote', QUOTE_DEFAULTS);
  const lang = useLang();
  const t = useT();
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const quote = QUOTES[index] ?? QUOTES[0];
  const intervalMs = settings.shown.refreshSec * 1000;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIndex(current => nextQuoteIndex(current, QUOTES.length));
      setStartedAt(Date.now());
    }, intervalMs);
    return () => window.clearTimeout(timerId);
  }, [startedAt, intervalMs]);

  const refresh = () => {
    setIndex(current => nextQuoteIndex(current, QUOTES.length));
    setStartedAt(Date.now());
  };

  return (
    <div>
      <p className={styles.quote} style={{fontSize: `${settings.shown.fontSize}px`}}>
        {quote.text[lang]}
      </p>
      <p className={styles.from}>{quote.from}</p>
      <RemainBar
        durationMs={intervalMs}
        startedAt={startedAt}
        label={t('quote.remaining')}
        refreshLabel={t('quote.refresh')}
        onRefresh={refresh}
      />
      {settings.isOpen ? (
        <SettingsModal title={t('settings.quote')} onSave={settings.save} onClose={settings.close}>
          <DisplaySettingsFields
            value={settings.draft}
            onChange={settings.setDraft}
            showRefresh
          />
        </SettingsModal>
      ) : null}
    </div>
  );
}
