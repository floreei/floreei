import type { ArrangementSize, StoreCategory } from "@sistema-flores/types";
import type { DataSource } from "typeorm";
import { ArrangementEntity } from "../modules/arrangements/infrastructure/arrangement.entity";
import { ReviewEntity } from "../modules/reviews/infrastructure/review.entity";

interface FloravieBuque {
  name: string;
  cat: StoreCategory;
  price: number;
  /** Caminho da imagem — servido pelo próprio site da Floravie (`/images/...`). */
  img: string;
  badge: string | null;
  desc: string;
  sizes: ArrangementSize[];
}

/**
 * Catálogo da Floravie (espelho do mock `apps/floravie/src/lib/products.ts`).
 * Fonte única no back para registrar os buquês como arranjos publicados. As
 * imagens são caminhos relativos servidos pelo site da Floravie.
 */
export const FLORAVIE_BUQUES: FloravieBuque[] = [
  {
    name: "Buquê 12 Rosas Rosé",
    cat: "buques",
    price: 189.9,
    img: "/images/prod-rosas-rose.jpg",
    badge: "Mais vendido",
    desc: "Doze rosas em tons de rosé, selecionadas na manhã da entrega e finalizadas com folhagens frescas, papel artesanal e laço de cetim. Acompanha cartão escrito à mão.",
    sizes: [
      { label: "Padrão · 12 rosas", priceDelta: 0 },
      { label: "Grande · 18 rosas", priceDelta: 60 },
      { label: "Deluxe · 24 rosas", priceDelta: 120 },
    ],
  },
  {
    name: "Buquê de Girassóis Alegria",
    cat: "buques",
    price: 159.9,
    img: "/images/prod-girassois.jpg",
    badge: null,
    desc: "Girassóis vibrantes embrulhados em papel kraft com toque rústico. A escolha certa para levar luz e bom humor a qualquer dia.",
    sizes: [
      { label: "Padrão · 5 girassóis", priceDelta: 0 },
      { label: "Grande · 8 girassóis", priceDelta: 45 },
    ],
  },
  {
    name: "Buquê Flores do Campo",
    cat: "buques",
    price: 139.9,
    img: "/images/prod-flores-campo.jpg",
    badge: "Novo",
    desc: "Mistura despretensiosa de flores da estação em cores variadas, com aquele charme de colheita recém-feita.",
    sizes: [
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 40 },
    ],
  },
  {
    name: "Buquê Jardim Tropical",
    cat: "buques",
    price: 174.9,
    img: "/images/prod-jardim-tropical.jpg",
    badge: null,
    desc: "Cores intensas e texturas marcantes inspiradas nos jardins do Nordeste. Um presente impossível de passar despercebido.",
    sizes: [
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 55 },
    ],
  },
  {
    name: "Buquê Serenidade Branca",
    cat: "buques",
    price: 199.9,
    img: "/images/prod-serenidade-branca.jpg",
    badge: null,
    desc: "Flores brancas e rosadas em composição delicada, perfeitas para agradecer, acolher ou celebrar recomeços.",
    sizes: [
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 50 },
    ],
  },
  {
    name: "Buquê Surpresa da Florista",
    cat: "buques",
    price: 149.9,
    img: "/images/prod-surpresa-florista.jpg",
    badge: null,
    desc: "Deixe a criação por nossa conta: a florista monta um buquê exclusivo com as flores mais bonitas do dia. Sempre uma surpresa, sempre lindo.",
    sizes: [
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 45 },
      { label: "Deluxe", priceDelta: 95 },
    ],
  },
  {
    name: "Orquídea Phalaenopsis Lilás",
    cat: "vasos",
    price: 219.9,
    img: "/images/prod-orquidea-lilas.jpg",
    badge: "Dura +30 dias",
    desc: "Orquídea Phalaenopsis em vaso de vidro, com hastes floridas que duram semanas. Acompanha guia de cuidados.",
    sizes: [
      { label: "1 haste", priceDelta: 0 },
      { label: "2 hastes", priceDelta: 70 },
    ],
  },
  {
    name: "Arranjo Jardim Rosé",
    cat: "arranjos",
    price: 249.9,
    img: "/images/prod-arranjo-jardim-rose.jpg",
    badge: null,
    desc: "Arranjo de mesa em tons de rosa montado em vaso de vidro, pronto para decorar sem precisar de nada além de água fresca.",
    sizes: [{ label: "Único", priceDelta: 0 }],
  },
  {
    name: "Cesta Bom Dia com Flores",
    cat: "cestas",
    price: 289.9,
    img: "/images/prod-cesta-bom-dia.jpg",
    badge: "Café da manhã",
    desc: "Café da manhã completo: pães, frutas, suco, geleia e bolo caseiro, decorado com flores frescas do ateliê.",
    sizes: [
      { label: "Para 1 pessoa", priceDelta: 0 },
      { label: "Para 2 pessoas", priceDelta: 80 },
    ],
  },
  {
    name: "Cesta Vinho & Delícias",
    cat: "cestas",
    price: 329.9,
    img: "/images/prod-cesta-vinho.jpg",
    badge: null,
    desc: "Vinho tinto selecionado acompanhado de pães artesanais, queijos e antepastos. Para brindar bons momentos.",
    sizes: [{ label: "Única", priceDelta: 0 }],
  },
  {
    name: "Urso de Pelúcia com Laço",
    cat: "cestas",
    price: 99.9,
    img: "/images/prod-urso-pelucia.jpg",
    badge: "Fofura",
    desc: "Urso de pelúcia macio com laço, o companheiro perfeito para acompanhar flores ou presentear sozinho.",
    sizes: [
      { label: "Médio · 30cm", priceDelta: 0 },
      { label: "Grande · 50cm", priceDelta: 60 },
    ],
  },
  {
    name: "Cesta de Flores no Vime",
    cat: "cestas",
    price: 209.9,
    img: "/images/prod-cesta-vime.jpg",
    badge: null,
    desc: "Flores frescas arranjadas em cesta de vime, uma peça que vira decoração assim que chega.",
    sizes: [
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 45 },
    ],
  },
];

/**
 * Registra (ou atualiza) os buquês do catálogo da Floravie como arranjos
 * PUBLICADOS da empresa. Idempotente: casa por nome dentro da empresa. Sem ficha
 * técnica (são itens de vitrine); o preço de venda é o do catálogo. Devolve os
 * arranjos resultantes (na ordem do catálogo).
 */
export async function registerFloravieCatalog(
  dataSource: DataSource,
  companyId: string,
): Promise<ArrangementEntity[]> {
  const repo = dataSource.getRepository(ArrangementEntity);
  const result: ArrangementEntity[] = [];
  for (const b of FLORAVIE_BUQUES) {
    const existing = await repo.findOne({ where: { companyId, name: b.name } });
    const fields = {
      companyId,
      name: b.name,
      pricingMode: "FIXED" as const,
      salePrice: b.price,
      active: true,
      storePublished: true,
      storeCategory: b.cat,
      badge: b.badge,
      description: b.desc,
      imageUrl: b.img,
      storeSizes: b.sizes,
    };
    const entity = existing
      ? Object.assign(existing, fields)
      : repo.create({ ...fields, items: [] });
    result.push(await repo.save(entity));
  }
  return result;
}

// ── Avaliações semeadas (credibilidade) ────────────────────────────────────
// Nomes/comentários realistas; distribuídos deterministicamente por buquê.
const REVIEW_AUTHORS = [
  "Mariana S.", "Rafael T.", "Camila R.", "João P.", "Beatriz L.",
  "Lucas M.", "Fernanda A.", "Paulo R.", "Aline C.", "Diego F.",
  "Renata V.", "Tiago N.",
];
const REVIEW_COMMENTS = [
  "Chegou lindo e super fresco, amei!",
  "Entrega no mesmo dia, pontualíssimo.",
  "Superou minhas expectativas.",
  "Presente perfeito, todos elogiaram.",
  "As flores duraram bastante, valeu cada centavo.",
  "Atendimento nota 10, recomendo demais.",
  "Comprei de novo, sempre caprichado.",
  "Minha mãe amou, muito obrigada!",
  "Embalagem impecável e cartão fofo.",
  "Exatamente como na foto.",
  "Qualidade excelente, virei cliente.",
  "Rápido e caprichado, adorei.",
];
// Notas por buquê (média ~5 ou ~4), refletindo o rating do mock.
const RATINGS_FIVE = [5, 5, 5, 5, 5, 4];
const RATINGS_FOUR = [4, 5, 4, 3, 4, 5];
// Buquês que no mock tinham 4 estrelas; o resto tinha 5.
const FOUR_STAR = new Set(["Buquê Flores do Campo", "Cesta Vinho & Delícias"]);

/**
 * Semeia algumas avaliações APROVADas por buquê da Floravie, pra o rating não
 * ficar zerado na vitrine. Idempotente: só semeia num buquê que ainda não tem
 * avaliação `SEED`. Requer que o catálogo já exista (rode `register` antes).
 */
export async function seedFloravieReviews(
  dataSource: DataSource,
  companyId: string,
): Promise<number> {
  const arrRepo = dataSource.getRepository(ArrangementEntity);
  const reviewRepo = dataSource.getRepository(ReviewEntity);
  let created = 0;
  for (let i = 0; i < FLORAVIE_BUQUES.length; i += 1) {
    const b = FLORAVIE_BUQUES[i];
    const arr = await arrRepo.findOne({ where: { companyId, name: b.name } });
    if (!arr) continue;
    const already = await reviewRepo.count({
      where: { arrangementId: arr.id, source: "SEED" },
    });
    if (already > 0) continue;
    const ratings = FOUR_STAR.has(b.name) ? RATINGS_FOUR : RATINGS_FIVE;
    const rows = ratings.map((rating, j) =>
      reviewRepo.create({
        companyId,
        arrangementId: arr.id,
        authorName: REVIEW_AUTHORS[(i + j) % REVIEW_AUTHORS.length],
        rating,
        comment: REVIEW_COMMENTS[(i * 2 + j) % REVIEW_COMMENTS.length],
        status: "APPROVED" as const,
        source: "SEED" as const,
      }),
    );
    await reviewRepo.save(rows);
    created += rows.length;
  }
  return created;
}
