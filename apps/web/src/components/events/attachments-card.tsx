"use client";

import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import {
  useAddAttachment,
  useDeleteAttachment,
  useEventAttachments,
} from "@/lib/api/events";

export function AttachmentsCard({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventAttachments(eventId);
  const add = useAddAttachment(eventId);
  const remove = useDeleteAttachment(eventId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Contrato, comprovantes, referências de decoração (imagem ou PDF).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
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
          <p className="py-1 text-sm text-muted-foreground">
            Nenhum anexo ainda.
          </p>
        )}

        <FileUpload
          scope="events"
          value={null}
          label="Anexar arquivo"
          onChange={async (file) => {
            if (!file) return;
            try {
              await add.mutateAsync({ label: file.label, url: file.url });
              toast.success("Anexo adicionado.");
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao adicionar.",
              );
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
