// Ícones lucide (traço 1.75, currentColor) — subconjunto usado no kit ERP.
// Mesmo sistema do produto (lucide-react). Não desenhar ícones próprios.
/* __IIFE__ */
(function(){
function Svg({ children, size = 20, stroke = 1.75, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {children}
    </svg>
  );
}

const Icon = {
  Painel: (p) => <Svg {...p}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></Svg>,
  Clientes: (p) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  Orcamento: (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h4"/></Svg>,
  Estoque: (p) => <Svg {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></Svg>,
  Compras: (p) => <Svg {...p}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></Svg>,
  Financeiro: (p) => <Svg {...p}><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="M2 10h20"/></Svg>,
  Relatorios: (p) => <Svg {...p}><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></Svg>,
  Busca: (p) => <Svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Svg>,
  Mais: (p) => <Svg {...p}><path d="M5 12h14"/><path d="M12 5v14"/></Svg>,
  Sino: (p) => <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Svg>,
  Reticencias: (p) => <Svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Svg>,
  Seta: (p) => <Svg {...p}><path d="m9 18 6-6-6-6"/></Svg>,
  Sobe: (p) => <Svg {...p}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></Svg>,
  Desce: (p) => <Svg {...p}><path d="M7 7 17 17"/><path d="M17 7v10H7"/></Svg>,
  Calendario: (p) => <Svg {...p}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></Svg>,
  Flor: (p) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="m7.5 12 1.5.5"/><path d="M12 16.5V15"/><path d="m16.5 12-1.5-.5"/></Svg>,
};

window.Icon = Icon;
window.Svg = Svg;
})();
