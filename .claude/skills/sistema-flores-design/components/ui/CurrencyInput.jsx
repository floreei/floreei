import React from 'react';
import { Input } from './Input.jsx';

/**
 * CurrencyInput — entrada monetária BRL. Acumulador de centavos: o usuário
 * digita dígitos e o valor é formatado como R$ 0,00 da direita para a esquerda.
 * Emite onValueChange(cents:number). inputMode numérico.
 */
export function CurrencyInput({ value, defaultValue = 0, onValueChange, error = false, ...rest }) {
  const [cents, setCents] = React.useState(value != null ? value : defaultValue);
  const current = value != null ? value : cents;

  function format(c) {
    const n = (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n;
  }
  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '');
    const next = digits === '' ? 0 : parseInt(digits, 10);
    if (value == null) setCents(next);
    onValueChange && onValueChange(next);
  }

  return (
    <Input
      error={error}
      inputMode="numeric"
      leftAddon={<span style={{ fontWeight: 600, fontSize: 15 }}>R$</span>}
      value={format(current)}
      onChange={handleChange}
      style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
      {...rest}
    />
  );
}
