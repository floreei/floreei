import { Star } from "lucide-react";

export function SocialProof() {
  return (
    <div className="border-y border-border bg-secondary/50 py-6">
      <div className="sf-wrap flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-8 text-center">
        <span className="flex gap-0.5 text-clay">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4" fill="currentColor" />
          ))}
        </span>
        <span className="text-[15px] text-muted-foreground">
          <strong className="font-semibold text-foreground">
            Floriculturas, floristas, atacadistas e decoradores
          </strong>{" "}
          confiam no Floreei no dia a dia
        </span>
      </div>
    </div>
  );
}
