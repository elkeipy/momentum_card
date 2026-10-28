import React, {createContext, useContext} from 'react';

export type CardSettingsApi = {
  isOpen: boolean;
  close: () => void;
};

const CardSettingsContext = createContext<CardSettingsApi>({
  isOpen: false,
  close: () => undefined
});

export function CardSettingsProvider({
  value,
  children
}: {
  value: CardSettingsApi;
  children: React.ReactNode;
}) {
  return (
    <CardSettingsContext.Provider value={value}>{children}</CardSettingsContext.Provider>
  );
}

export function useCardSettings(): CardSettingsApi {
  return useContext(CardSettingsContext);
}
