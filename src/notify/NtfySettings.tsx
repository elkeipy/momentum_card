import React, {useState} from 'react';
import SettingsModal from '../components/SettingsModal';
import styles from '../css/SettingsModal.module.css';
import {
  readNtfyTopic,
  sanitizeNtfyTopicDraft,
  writeNtfyTopic
} from './ntfy';

export default function NtfySettings() {
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
        푸시 알림
      </button>
      {isOpen ? (
        <SettingsModal title="푸시 알림" onSave={save} onClose={close}>
          <div className={styles.textField}>
            <label htmlFor="ntfy-topic" className={styles.optionLabel}>
              ntfy 토픽
            </label>
            <input
              id="ntfy-topic"
              className={styles.textInput}
              value={draft}
              autoComplete="off"
              spellCheck={false}
              placeholder="비우면 보내지 않음"
              onChange={event =>
                setDraft(sanitizeNtfyTopicDraft(event.target.value))
              }
            />
            <p className={styles.hint}>
              폰 ntfy 앱이나 ntfy.sh/app에서 같은 토픽을 구독한다.
              보드 탭이 열려 있을 때만 나간다. 토픽 이름이 비밀번호다.
            </p>
          </div>
        </SettingsModal>
      ) : null}
    </>
  );
}
