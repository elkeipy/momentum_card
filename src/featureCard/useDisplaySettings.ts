import {useEffect, useState} from 'react';
import {useCardSettings} from './cardSettingsContext';
import {
  readDisplaySettings,
  writeDisplaySettings,
  type DisplaySettings
} from './cardSettings';

export function useDisplaySettings(id: string, fallback: DisplaySettings) {
  const ui = useCardSettings();
  const [saved, setSaved] = useState(() => readDisplaySettings(localStorage, id, fallback));
  const [draft, setDraft] = useState(saved);

  useEffect(() => {
    if (ui.isOpen) {
      setDraft(saved);
    }
  }, [ui.isOpen, saved]);

  const save = () => {
    writeDisplaySettings(localStorage, id, draft);
    setSaved(draft);
    ui.close();
  };

  const shown = ui.isOpen ? draft : saved;
  return {saved, draft, shown, setDraft, save, close: ui.close, isOpen: ui.isOpen};
}
