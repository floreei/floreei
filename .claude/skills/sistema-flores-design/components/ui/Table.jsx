import React from 'react';

/**
 * Table — tabela densa e responsiva. columns: [{ key, header, align, hideBelow, render, tabular }].
 * hideBelow ('sm'|'md'|'lg') esconde colunas secundárias no mobile, mantendo o essencial.
 */
export function Table({ columns = [], data = [], rowKey = 'id', onRowClick, empty = null, style = {} }) {
  const hideClass = { sm: 'sf-hide-sm', md: 'sf-hide-md', lg: 'sf-hide-lg' };
  return (
    <div style={{ width: '100%', overflowX: 'auto', ...style }}>
      <style>{`
        @media (max-width: 640px){ .sf-hide-sm{display:none!important} }
        @media (max-width: 768px){ .sf-hide-md{display:none!important} }
        @media (max-width: 1024px){ .sf-hide-lg{display:none!important} }
      `}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.hideBelow ? hideClass[c.hideBelow] : ''}
                style={{ textAlign: c.align || 'left', padding: '10px 14px', color: 'hsl(var(--muted-foreground))',
                  fontWeight: 600, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em',
                  borderBottom: '1px solid hsl(var(--border))', whiteSpace: 'nowrap' }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && empty && (
            <tr><td colSpan={columns.length} style={{ padding: 0 }}>{empty}</td></tr>
          )}
          {data.map((row, i) => (
            <tr key={row[rowKey] ?? i} onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background var(--duration-fast) var(--ease-standard)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {columns.map((c) => (
                <td key={c.key} className={c.hideBelow ? hideClass[c.hideBelow] : ''}
                  style={{ textAlign: c.align || 'left', padding: '12px 14px',
                    borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))',
                    fontVariantNumeric: c.tabular ? 'tabular-nums' : 'normal', whiteSpace: 'nowrap' }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
