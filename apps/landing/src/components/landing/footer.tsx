import { Flower2 } from "lucide-react";
import { CONTACT_EMAIL, NAV_ITEMS, WHATSAPP_LINK } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="sf-wrap grid grid-cols-[1.6fr_1fr_1fr] gap-10 max-[720px]:grid-cols-1">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Flower2 className="h-[18px] w-[18px]" />
            </span>
            <span className="sf-serif text-[19px] font-semibold">
              Floreei
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Gestão completa para floriculturas, floristas, atacado e decoração
            de eventos. Do orçamento ao caixa, em um só lugar.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Produto</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="sf-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contato</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="sf-link"
              >
                WhatsApp comercial
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="sf-link">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="sf-wrap mt-16 flex flex-wrap justify-between gap-2 border-border pt-8 text-xs text-muted-foreground">
        <span>© 2025 Floreei. Todos os direitos reservados.</span>
        <span>Feito com carinho para quem trabalha com flores.</span>
      </div>
    </footer>
  );
}
