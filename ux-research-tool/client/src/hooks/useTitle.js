import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ResearchKit` : 'ResearchKit';
    return () => { document.title = prev; };
  }, [title]);
}
