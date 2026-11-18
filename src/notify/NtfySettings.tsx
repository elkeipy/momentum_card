import React, {useState} from 'react';
import SettingsModal from '../components/SettingsModal';
import {useT} from '../i18n/i18n';
import styles from '../css/SettingsModal.module.css';
import {
  readNtfyTopic,
  sanitizeNtfyTopicDraft,
  writeNtfyTopic
} from './ntfy';

export default function NtfySettings() {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => readNtfyTopic(localStorage));

  const close = () => {
    setDraft(readNtfyTopic(localStorage));
    setIsOpen(false);
  };

  const save = () => {
    writeNtfyTopic(localStorage, draft);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="app-button"
        onClick={() => {
          setDraft(readNtfyTopic(localStorage));
          setIsOpen(true);
        }}
      >
        {t('ntfy.title')}
      </button>
      {isOpen ? (
        <SettingsModal title={t('ntfy.title')} onSave={save} onClose={close}>
          <div className={styles.textField}>
            <label htmlFor="ntfy-topic" className={styles.optionLabel}>
              {t('ntfy.topic')}
            </label>
            <input
              id="ntfy-topic"
              className={styles.textInput}
              value={draft}
              autoComplete="off"
              spellCheck={false}
              placeholder={t('ntfy.placeholder')}
              onChange={event =>
                setDraft(sanitizeNtfyTopicDraft(event.target.value))
              }
            />
            <p className={styles.hint}>{t('ntfy.hint')}</p>
          </div>
        </SettingsModal>
      ) : null}
    </>
  );
}
