import { Flower2 } from "lucide-react";
import { NAV_ITEMS, WHATSAPP_LINK } from "@/lib/site";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";

export function Header() {
  return (
    <header
      id="top"
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "hsl(var(--background) / .82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="sf-wrap flex h-[68px] items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Flower2 className="h-[18px] w-[18px]" />
          </span>
          <span className="sf-serif text-[19px] font-semibold">
            Floreei
          </span>
        </a>

        <nav className="flex items-center gap-7 max-[900px]:hidden">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="sf-link">
              {item.label}
            </a>
          ))}
        </nav>

        <Cta href={WHATSAPP_LINK} className="!h-11 !px-4 max-[560px]:!px-3">
          <WhatsappIcon className="h-[18px] w-[18px]" />
          <span className="max-[560px]:hidden">Falar no WhatsApp</span>
          <span className="hidden max-[560px]:inline">WhatsApp</span>
        </Cta>
      </div>
    </header>
  );
}
