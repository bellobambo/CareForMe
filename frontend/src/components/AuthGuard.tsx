"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();
        if (session.tokens?.idToken) {
          setIsAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth error", error);
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Verifying access...</div>;
  }

  return <>{children}</>;
}
