"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNcmSearch, useNcmSuggestions } from "@/lib/api/ncm";
import { useDebounce } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";

/**
 * Busca de NCM: sem API de busca oficial (o Siscomex só dá a tabela inteira),
 * a busca roda no back-end (unaccent + pg_trgm sobre a descrição
 * hierárquica). Com o campo vazio, mostra a lista curada de sinônimos comuns
 * de floricultura ("buquê", "vaso de flor" etc.) em vez de nada.
 */
export function NcmCombobox({
  value,
  onChange,
  className,
  "data-testid": testId,
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  "data-testid"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isFetching } = useNcmSearch(debouncedQuery);
  const { data: suggestions } = useNcmSuggestions();

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Buscar NCM…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Código ou nome (ex.: rosa, buquê, 0603)…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim() ? (
              <>
                {!isFetching && results?.length === 0 && (
                  <CommandEmpty>Nenhum NCM encontrado.</CommandEmpty>
                )}
                <CommandGroup>
                  {(results ?? []).map((entry) => (
                    <CommandItem
                      key={entry.code}
                      value={entry.code}
                      onSelect={() => select(entry.code)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === entry.code ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-mono text-xs">{entry.code}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {entry.hierarchicalDescription}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <CommandGroup heading="Sugestões de floricultura">
                {(suggestions ?? []).map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.ncmCode}
                    onSelect={() => select(s.ncmCode)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === s.ncmCode ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs">{s.ncmCode}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
