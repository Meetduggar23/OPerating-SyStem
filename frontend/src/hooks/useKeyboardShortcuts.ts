import { useEffect, useCallback, useRef, useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { KEYBOARD_SHORTCUTS } from '@shared/constants';
import type { KeyboardShortcut } from '@shared/types';

interface ShortcutHandler {
  (shortcut: KeyboardShortcut): void;
}

export function useKeyboardShortcuts(handlers: Map<string, ShortcutHandler>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? 'Meta' : 'Control';

      for (const shortcut of KEYBOARD_SHORTCUTS) {
        const keys = shortcut.keys.map((k) => (k === 'Ctrl' || k === 'Meta' ? modifier : k));
        const match = keys.every((key, index) => {
          if (index === keys.length - 1) {
            return e.key.toLowerCase() === key.toLowerCase();
          }
          return key === 'Shift' ? e.shiftKey :
                 key === 'Alt' ? e.altKey :
                 key === 'Control' || key === 'Meta' ? (isMac ? e.metaKey : e.ctrlKey) : false;
        });

        if (match) {
          e.preventDefault();
          e.stopPropagation();
          const handler = handlersRef.current.get(shortcut.action);
          if (handler) handler(shortcut);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export function useGlobalShortcut(
  keys: string[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? 'Meta' : 'Control';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target as HTMLElement).isContentEditable) {
        return;
      }

      const match = keys.every((key, index) => {
        const normalizedKey = key === 'Ctrl' || key === 'Meta' ? modifier : key;
        if (index === keys.length - 1) {
          return e.key.toLowerCase() === normalizedKey.toLowerCase();
        }
        return normalizedKey === 'Shift' ? e.shiftKey :
               normalizedKey === 'Alt' ? e.altKey :
               normalizedKey === 'Control' || normalizedKey === 'Meta' ? (isMac ? e.metaKey : e.ctrlKey) : false;
      });

      if (match) {
        e.preventDefault();
        e.stopPropagation();
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, ...deps]);
}

export function useShortcutHelp() {
  const [visible, setVisible] = useState(false);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  return { visible, toggle, show, hide };
}