"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { useTransition } from "react";
import { Button } from "./ui/button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="gap-2 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      onClick={() => {
        startTransition(() => {
          logout();
        });
      }}
      disabled={isPending}
    >
      <LogOut className="w-4 h-4" />
      <span className="text-[10px] md:text-sm">{isPending ? "..." : "Thoát"}</span>
    </Button>
  );
}
