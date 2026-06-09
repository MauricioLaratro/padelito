import { useEffect, useState } from "react";

/**
 * Persiste estado React en localStorage.
 * Se construye para validar el MVP sin pedir credenciales externas.
 * Lo usan hooks de features mientras Supabase queda preparado.
 * Sirve para que las acciones del demo sobrevivan recargas locales.
 */
export function useLocalStorageState<StateValue>(
  storageKey: string,
  createInitialState: () => StateValue,
) {
  const [storedState, setStoredState] = useState<StateValue>(() => {
    const serializedState = window.localStorage.getItem(storageKey);

    if (!serializedState) {
      return createInitialState();
    }

    try {
      return JSON.parse(serializedState) as StateValue;
    } catch {
      return createInitialState();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(storedState));
  }, [storageKey, storedState]);

  return [storedState, setStoredState] as const;
}
