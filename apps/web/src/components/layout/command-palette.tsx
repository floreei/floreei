"use client";

import {
  searchTypeLabels,
  type SearchResult,
  type SearchResultType,
} from "@sistema-flores/types";
import {
  CalendarHeart,
  FileText,
  Plus,
  ShoppingBasket,
  Sprout,
  Truck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearch } from "@/lib/api/search";
import { useDebounce } from "@/lib/use-debounce";
import { navItems, navItemUnlocked } from "./nav";
import { useAuth } from "@/lib/auth/auth-context";

const CommandPaletteContext = createContext<{ open: () => void } | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette fora do provider");
  return ctx;
}

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  customer: <Users className="h-4 w-4 text-muted-foreground" />,
  event: <CalendarHeart className="h-4 w-4 text-muted-foreground" />,
  quote: <FileText className="h-4 w-4 text-muted-foreground" />,
  product: <Sprout className="h-4 w-4 text-muted-foreground" />,
  supplier: <Truck className="h-4 w-4 text-muted-foreground" />,
  purchase: <ShoppingBasket className="h-4 w-4 text-muted-foreground" />,
};

const typeOrder: SearchResultType[] = [
  "event",
  "quote",
  "customer",
  "product",
  "supplier",
  "purchase",
];

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 200);
  const { data: results, isFetching } = useSearch(debounced);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const grouped = useMemo(() => {
    const map = new Map<SearchResultType, SearchResult[]>();
    for (const r of results ?? []) {
      const list = map.get(r.type) ?? [];
      list.push(r);
      map.set(r.type, list);
    }
    return typeOrder
      .filter((t) => map.has(t))
      .map((t) => ({ type: t, items: map.get(t)! }));
  }, [results]);

  const searching = debounced.trim().length >= 2;

  return (
    <CommandPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, eventos, orçamentos, produtos…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {searching ? (
            <>
              {!isFetching && grouped.length === 0 ? (
                <CommandEmpty>Nada encontrado para “{debounced}”.</CommandEmpty>
              ) : null}
              {grouped.map((group) => (
                <CommandGroup key={group.type} heading={searchTypeLabels[group.type]}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      value={`${item.type}-${item.id}-${item.label}`}
                      onSelect={() => go(item.href)}
                    >
                      {typeIcons[item.type]}
                      <span className="flex-1">{item.label}</span>
                      {item.sublabel ? (
                        <span className="text-xs text-muted-foreground">
                          {item.sublabel}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </>
          ) : (
            <>
              <CommandGroup heading="Navegar">
                {navItems
                  .filter((i) => !i.adminOnly || user?.role === "ADMIN")
                  .filter((i) => navItemUnlocked(i, user?.access?.features))
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.href}
                        value={item.label}
                        onSelect={() => go(item.href)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
              <CommandGroup heading="Criar">
                <CommandItem value="Novo orçamento" onSelect={() => go("/orcamentos/novo")}>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  Novo orçamento
                </CommandItem>
                <CommandItem value="Nova compra" onSelect={() => go("/compras")}>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  Nova compra
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
