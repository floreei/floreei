"use client";

import { createUserSchema, type InviteResult, type Role } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Plus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/field";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { useCreateMember, useTeam } from "@/lib/api/users";

export default function TeamPage() {
  const { data: team, isLoading } = useTeam();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Quem tem acesso ao sistema da sua empresa."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Convidar membro
        </Button>
      </PageHeader>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : team && team.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role === "ADMIN" ? "Administrador" : "Operador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.pending ? (
                      <Badge variant="outline" className="text-amber-600">
                        Convite pendente
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Ativo</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState className="border-0" icon={<UsersRound />} title="Sem membros" />
        )}
      </Card>

      <InviteDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateMember();
  const [result, setResult] = useState<InviteResult | null>(null);
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "OPERATOR" as Role },
  });

  useEffect(() => {
    if (open) {
      setResult(null);
      form.reset({ name: "", email: "", role: "OPERATOR" });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {result ? (
          <InviteCreated result={result} onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Convidar membro</DialogTitle>
              <DialogDescription>
                A pessoa recebe um link por e-mail para definir a própria senha e
                entrar na sua empresa.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setResult(await create.mutateAsync(values));
                } catch (error) {
                  toast.error(
                    error instanceof ApiError
                      ? error.message
                      : "Erro ao convidar.",
                  );
                }
              })}
            >
              <Field label="Nome" htmlFor="m-name" required error={form.formState.errors.name?.message}>
                <Input id="m-name" autoFocus {...form.register("name")} />
              </Field>
              <Field label="E-mail" htmlFor="m-email" required error={form.formState.errors.email?.message}>
                <Input id="m-email" type="email" {...form.register("email")} />
              </Field>
              <Field label="Papel">
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERATOR">Operador</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  Enviar convite
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteCreated({
  result,
  onClose,
}: {
  result: InviteResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    toast.success("Link copiado.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Convite criado</DialogTitle>
        <DialogDescription>
          Enviamos um e-mail para <strong>{result.user.email}</strong>. Se
          preferir, copie o link abaixo e mande você mesmo — ele leva a pessoa
          direto para definir a senha.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <Input readOnly value={result.inviteUrl} className="text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          Concluir
        </Button>
      </DialogFooter>
    </>
  );
}
