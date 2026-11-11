import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/base.api';
import type { PartnerPage } from './partner.types';

export function usePartnerPage<T extends { id: string }>(fetchPage: (cursor?: string) => Promise<PartnerPage<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const pending = useRef(false);
  const load = useCallback(async (after?: string) => {
    if (pending.current) return;
    pending.current = true;
    const current = ++generation.current;
    setLoading(true); setError('');
    try {
      const result = await fetchPage(after);
      if (current !== generation.current) return;
      setItems(previous => after ? [...previous, ...result.items.filter(item => !previous.some(old => old.id === item.id))] : result.items);
      setCursor(result.nextCursor);
    } catch (cause) { if (current === generation.current) setError(errorMessage(cause)); }
    finally { if (current === generation.current) { setLoading(false); pending.current = false; } }
  }, [fetchPage]);
  useEffect(() => { void load(); return () => { generation.current++; pending.current = false; }; }, [load]);
  return { items, setItems, cursor, loading, error, load };
}
