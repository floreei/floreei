import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Sistema Flores
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Gestão completa para floriculturas e eventos
        </h1>
        <p className="text-pretty text-lg text-muted-foreground">
          Centralize clientes, orçamentos e eventos. Calcule custo, venda, lucro
          e margem automaticamente — em poucos cliques.
        </p>
      </div>
      <Link
        href="/login"
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Entrar
      </Link>
    </main>
  );
}
