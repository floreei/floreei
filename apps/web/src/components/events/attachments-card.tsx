"use client";

import { attachmentInputSchema } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  useAddAttachment,
  useDeleteAttachment,
  useEventAttachments,
} from "@/lib/api/events";

export function AttachmentsCard({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventAttachments(eventId);
  const remove = useDeleteAttachment(eventId);
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Anexos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Referências de decoração, contrato, pasta de fotos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Adicionar link
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data && data.length > 0 ? (
          data.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5"
            >
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-1.5 truncate text-sm font-medium text-primary hover:underline"
              >
                {attachment.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <button
                aria-label="Remover anexo"
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={async () => {
                  try {
                    await remove.mutateAsync(attachment.id);
                    toast.success("Anexo removido.");
                  } catch {
                    toast.error("Erro ao remover.");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            Nenhum anexo. Adicione um link de referência.
          </p>
        )}
      </CardContent>

      <AddAttachmentDialog eventId={eventId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function AddAttachmentDialog({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddAttachment(eventId);
  const form = useForm({
    resolver: zodResolver(attachmentInputSchema),
    defaultValues: { label: "", url: "" },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset({ label: "", url: "" });
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar link</DialogTitle>
          <DialogDescription>
            Cole o link de uma pasta, board ou documento.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await add.mutateAsync(values);
              toast.success("Anexo adicionado.");
              form.reset({ label: "", url: "" });
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao adicionar.",
              );
            }
          })}
        >
          <Field label="Nome" htmlFor="at-label" required error={form.formState.errors.label?.message}>
            <Input id="at-label" autoFocus placeholder="Referências no Pinterest" {...form.register("label")} />
          </Field>
          <Field label="Link" htmlFor="at-url" required error={form.formState.errors.url?.message}>
            <Input id="at-url" placeholder="https://…" {...form.register("url")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
