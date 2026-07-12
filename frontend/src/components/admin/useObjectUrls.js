import { useCallback, useEffect, useRef } from "react";

/**
 * Object-URL lifecycle for staged image previews. `trackUrl(file)` creates
 * a preview URL and remembers it; `revokeAll()` releases every tracked URL
 * (call it on discard/reload). Everything is also revoked on unmount.
 */
export function useObjectUrls() {
  const urlsRef = useRef(new Set());

  const trackUrl = useCallback((file) => {
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);
    return url;
  }, []);

  const revokeAll = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
  }, []);

  useEffect(() => revokeAll, [revokeAll]);

  return { trackUrl, revokeAll };
}
