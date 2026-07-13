"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { AssistantPanel } from "./assistant-panel";

/** Entrada do assistente na barra superior — só aparece com a feature ASSISTANT. */
export function AssistantLauncher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const enabled = (user?.access?.features ?? []).includes("ASSISTANT");
  if (!enabled) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-primary"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Assistente</span>
      </Button>
      <AssistantPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
