import type { UseFormRegisterReturn } from "react-hook-form";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Telefone BR: (11) 91234-5678 ou (11) 1234-5678. */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00), detectado pelo tamanho. */
export function maskCpfCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    // CPF
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  // CNPJ
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/** CEP: 00000-000. */
export function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/**
 * Aplica uma máscara a um campo do react-hook-form: formata o valor antes de
 * repassar o evento ao RHF, mantendo o input controlado normalmente.
 *
 * Uso: <Input {...withMask(maskPhone, form.register("phone"))} inputMode="numeric" />
 */
export function withMask(
  mask: (v: string) => string,
  registration: UseFormRegisterReturn,
): UseFormRegisterReturn {
  return {
    ...registration,
    onChange: (event: Parameters<UseFormRegisterReturn["onChange"]>[0]) => {
      const target = event.target as HTMLInputElement;
      target.value = mask(target.value);
      return registration.onChange(event);
    },
  };
}
