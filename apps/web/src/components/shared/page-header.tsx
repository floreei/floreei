import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/** Cabeçalho de página: título serif + descrição + ações à direita. */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-serif text-3xl font-semibold leading-[1.1] text-foreground sm:text-[2.05rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-[0.95rem] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {children}
        </div>
      ) : null}
    </div>
  );
}
