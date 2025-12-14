import { useEffect } from 'react';
export default function useKonami(onUnlock) {
  useEffect(() => {
    const code = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba';
    let pos = 0;
    const handler = e => {
      pos = (code[pos] === e.key) ? pos + 1 : 0;
      if (pos === code.length) { onUnlock(); pos = 0; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUnlock]);
}