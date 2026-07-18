import { useCallback, useEffect, useState } from "react";
import { fetchCustomCategories } from "../../../../services/customLibraryService";
import type { CustomLibraryCategory } from "../../../../types/customLibrary";

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomLibraryCategory[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setCategories(await fetchCustomCategories());
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as categorias personalizadas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchCustomCategories()
      .then((nextCategories) => {
        if (!isMounted) return;
        setCategories(nextCategories);
        setError("");
      })
      .catch((loadError) => {
        if (!isMounted) return;
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as categorias personalizadas.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, error, isLoading, refresh };
}
