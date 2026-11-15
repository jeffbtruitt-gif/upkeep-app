import { useEffect, useState } from 'react';

const QUERY = '(max-width: 760px)';

/** True on phone-sized screens; updates on rotate/resize. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

/** Standard page padding. */
export function pagePad(mobile: boolean) {
  return mobile ? '16px 14px 24px' : '28px 32px';
}
