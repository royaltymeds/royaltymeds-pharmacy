"use client";

import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
    >
      Logout
    </button>
  );
}
