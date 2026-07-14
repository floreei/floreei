"use client";

import { useEffect, useState } from "react";
import { USE_MOCK } from "@/lib/config";
import { fetchReviews, submitReview } from "@/lib/reviews";
import type { Review } from "@/lib/types";
import { Stars } from "./stars";
import { useStore } from "./store-provider";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ProductReviews({
  productId,
  rating,
  reviews,
}: {
  productId: string;
  rating: number;
  reviews: number;
}) {
  const { showToast } = useStore();
  const [list, setList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rate, setRate] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      setList([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchReviews(productId).then((r) => {
      if (active) {
        setList(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [productId]);

  const resetForm = () => {
    setShowForm(false);
    setName("");
    setComment("");
    setRate(5);
  };

  const send = async () => {
    if (!name.trim()) {
      showToast("Informe seu nome 🌸");
      return;
    }
    setSending(true);
    if (USE_MOCK) {
      showToast("Avaliação enviada! Obrigado 🌷");
      resetForm();
      setSending(false);
      return;
    }
    const created = await submitReview(productId, {
      authorName: name.trim(),
      rating: rate,
      comment: comment.trim() || undefined,
    });
    setSending(false);
    if (created) {
      setList((prev) => [created, ...prev]);
      showToast("Avaliação enviada! Obrigado 🌷");
      resetForm();
    } else {
      showToast("Não foi possível enviar. Tente novamente 🌸");
    }
  };

  // Em modo API a média/contagem vêm das reviews carregadas; em mock, do produto.
  const avg =
    !USE_MOCK && list.length > 0
      ? list.reduce((s, r) => s + r.rating, 0) / list.length
      : rating;
  const count = USE_MOCK ? reviews : list.length;

  return (
    <div className="reviews">
      <h3>Avaliações</h3>
      <div className="reviews-summary">
        <Stars rating={avg} />
        <b>{avg.toFixed(1).replace(".", ",")}</b>
        <span>
          · {count} {count === 1 ? "avaliação" : "avaliações"}
        </span>
      </div>

      {!showForm && (
        <button
          className="btn btn-ghost"
          style={{ alignSelf: "flex-start", flex: "0 0 auto", padding: "12px 28px" }}
          onClick={() => setShowForm(true)}
        >
          Avaliar este produto
        </button>
      )}

      {showForm && (
        <div className="review-form">
          <h4>Deixe sua avaliação</h4>
          <div className="rate-input" role="radiogroup" aria-label="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={n <= rate ? "on" : ""}
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                onClick={() => setRate(n)}
              >
                ★
              </button>
            ))}
          </div>
          <input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Seu nome"
          />
          <textarea
            placeholder="Conte como foi sua experiência (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-label="Comentário"
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={send} disabled={sending}>
              {sending ? "Enviando…" : "Enviar avaliação"}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="review-empty">Carregando avaliações…</p>
      ) : list.length === 0 ? (
        <p className="review-empty">
          {USE_MOCK
            ? "As avaliações reais da loja aparecem aqui quando conectada à API."
            : "Ainda não há avaliações. Seja a primeira pessoa a avaliar 🌷"}
        </p>
      ) : (
        <div className="review-list">
          {list.map((r) => (
            <div className="review" key={r.id}>
              <div className="review-head">
                <span className="review-author">{r.authorName}</span>
                <Stars rating={r.rating} />
                <span className="review-date">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
