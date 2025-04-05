import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<null | { name: string }>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setUser(null);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return { user, isLoading };
}
