import type { ProductUnit } from "@sistema-flores/types";

export const unitLabels: Record<ProductUnit, string> = {
  UNIDADE: "Unidade",
  MACO: "Maço",
  HASTE: "Haste",
  VASO: "Vaso",
  CAIXA: "Caixa",
  METRO: "Metro",
  GRAMA: "Grama",
  PACOTE: "Pacote",
};

export const unitOptions = Object.entries(unitLabels) as Array<
  [ProductUnit, string]
>;
