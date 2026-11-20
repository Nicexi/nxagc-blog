import { useEffect } from 'react';
import { site } from './site.js';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${site.shortTitle}` : site.title;
  }, [title]);
}
