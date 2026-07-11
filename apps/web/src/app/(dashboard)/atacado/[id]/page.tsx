// Detalhe da venda no atacado — mesma tela do varejo (o componente já é ciente
// do canal: o "voltar" leva para /atacado). Vive em /atacado/[id] para o
// atacado ter sua própria URL, separada de /vendas.
export { default } from "../../vendas/[id]/page";
