import { useCallback, useEffect, useState } from 'react';

import { getCatalog } from '@/services/catalog-api';
import { useConnectivity } from '@/components/app-shell-context';
import type { CatalogResponse } from '@/types/catalog';

export function useCatalog() {
  const { reportOffline } = useConnectivity();
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getCatalog());
      setError(null);
    } catch (requestError) {
      reportOffline();
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar o catálogo.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportOffline]);

  const refresh = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    let active = true;
    getCatalog()
      .then((catalog) => {
        if (active) {
          setData(catalog);
          setError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          reportOffline();
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar o catálogo.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reportOffline]);

  return { data, loading, refreshing, error, refresh };
}
