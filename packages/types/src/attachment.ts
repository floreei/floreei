import { z } from "zod";

/** Anexo de um evento: um link (referência de decoração, contrato, pasta…). */
export const attachmentInputSchema = z.object({
  label: z.string().trim().min(1, "Dê um nome ao anexo").max(120),
  url: z
    .string()
    .trim()
    .url("Informe um link válido (http/https)")
    .max(500),
});
export type AttachmentInput = z.infer<typeof attachmentInputSchema>;

export interface EventAttachment {
  id: string;
  eventId: string;
  label: string;
  url: string;
  createdAt: string;
}
