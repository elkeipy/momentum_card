import {
  parseDisplaySettings,
  readDisplaySettings,
  REFRESH_SEC_DEFAULT,
  writeDisplaySettings
} from './cardSettings';

const fallback = {fontSize: 16, refreshSec: 60};

test('keeps display settings inside the allowed range', () => {
  expect(parseDisplaySettings({fontSize: 20, refreshSec: 90}, fallback)).toEqual({
    fontSize: 20,
    refreshSec: 90
  });
  expect(parseDisplaySettings({fontSize: 8, refreshSec: 90}, fallback).fontSize).toBe(16);
  expect(parseDisplaySettings('nope', fallback)).toEqual(fallback);
});

test('reads and writes stored display settings', () => {
  expect(readDisplaySettings({getItem: () => null}, 'quote', fallback)).toEqual(fallback);
  expect(
    readDisplaySettings({getItem: () => '{"fontSize":18,"refreshSec":30}'}, 'quote', fallback)
  ).toEqual({fontSize: 18, refreshSec: 30});
  expect(readDisplaySettings({getItem: () => '{'}, 'quote', fallback)).toEqual(fallback);

  const written: {key?: string; value?: string} = {};
  writeDisplaySettings(
    {
      setItem: (key, value) => {
        written.key = key;
        written.value = value;
      }
    },
    'quote',
    {fontSize: 22, refreshSec: REFRESH_SEC_DEFAULT}
  );
  expect(written).toEqual({
    key: 'card-settings:quote',
    value: '{"fontSize":22,"refreshSec":60}'
  });
});
