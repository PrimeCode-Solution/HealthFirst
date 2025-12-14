"use client";

import { useEffect, useState } from "react";

type UsePremiumAccessResult = {
  hasAccess: boolean | null;
  loading: boolean;
  error: string | null;
};

export function usePremiumAccess(userId?: string): UsePremiumAccessResult {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/premium-access`);
        if (!res.ok) {
          throw new Error("Erro ao verificar acesso");
        }
        const data = await res.json();
        setHasAccess(data.hasAccess === true);
      } catch (err) {
        setError("Erro ao verificar acesso premium");
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [userId]);

  return { hasAccess, loading, error };
}
