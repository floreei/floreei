"use client";

import { useState } from "react";
import { CIDADES } from "@/lib/constants";
import { money } from "@/lib/money";
import { CheckSuccessIcon } from "./icons";
import { useProductLookup } from "./products-provider";
import { useStore } from "./store-provider";

const STEP_LABELS = ["Entrega", "Mensagem", "Pagamento", "Revisão"];

type Errors = { dest: boolean; fone: boolean; end: boolean; card: boolean };
const noErrors: Errors = { dest: false, fone: false, end: false, card: false };

export function CheckoutModal() {
  const {
    checkoutOpen,
    closeCheckout,
    coStep,
    setCoStep,
    order,
    setOrder,
    cart,
    itemPrice,
    subtotal,
    frete,
    total,
    successNum,
    confirmOrder,
    clearCart,
  } = useStore();
  const productById = useProductLookup();

  const [errors, setErrors] = useState<Errors>(noErrors);

  const s = subtotal + frete; // total antes do desconto Pix

  const saveStep1 = () => {
    const e: Errors = {
      ...noErrors,
      dest: !order.dest.trim(),
      fone: !order.fone.trim(),
      end: !order.end.trim(),
    };
    setErrors(e);
    if (e.dest || e.fone || e.end) return;
    setCoStep(2);
  };

  const saveStep2 = () => {
    if (order.anon) setOrder({ de: "" });
    setCoStep(3);
  };

  const saveStep3 = () => {
    if (order.pay === "cartao") {
      const incompleto =
        !order.cardNum || !order.cardNome || !order.cardVal || !order.cardCvv;
      if (incompleto) {
        setErrors((prev) => ({ ...prev, card: true }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, card: false }));
    setCoStep(4);
  };

  const dataTxtReview =
    order.data === "hoje"
      ? "Hoje"
      : order.data === "amanha"
        ? "Amanhã"
        : order.dataAg || "Data agendada";

  return (
    <div
      className={`overlay${checkoutOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Finalizar pedido"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCheckout();
      }}
    >
      <div className="sheet checkout-sheet">
        <button className="close-x" onClick={closeCheckout} aria-label="Fechar">
          ✕
        </button>

        {successNum ? (
          <div className="success">
            <div className="ok-ring">
              <CheckSuccessIcon />
            </div>
            <h2>Pedido confirmado! 🌷</h2>
            <p className="order-no">
              Nº do pedido: <b>{successNum}</b>
            </p>
            <p>
              As flores de <b>{order.dest || "quem você ama"}</b> serão preparadas com
              todo carinho e entregues{" "}
              <b>
                {order.data === "hoje"
                  ? "ainda hoje"
                  : order.data === "amanha"
                    ? "amanhã"
                    : "na data agendada"}
              </b>{" "}
              no período da {order.periodo === "manha" ? "manhã" : "tarde"}.
            </p>
            <p>
              Você acompanharia o status por WhatsApp e e-mail.
              {order.pay === "pix" ? " O QR Code do Pix apareceria aqui." : ""}
            </p>
            <div
              className="co-nav"
              style={{ justifyContent: "center", marginTop: 28 }}
            >
              <button
                className="btn btn-primary"
                style={{ flex: "0 0 auto", paddingLeft: 44, paddingRight: 44 }}
                onClick={() => {
                  clearCart();
                  closeCheckout();
                }}
              >
                Voltar à loja
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="co-head">
              <h2 className="display">Finalizar pedido</h2>
            </div>
            <div className="steps">
              {STEP_LABELS.map((l, i) => {
                const n = i + 1;
                const cls =
                  n === coStep ? "active" : n < coStep ? "done" : "";
                return (
                  <div className={`step ${cls}`} key={l}>
                    {n < coStep ? "✓ " : ""}
                    {l}
                  </div>
                );
              })}
            </div>
            <div className="co-body">
              {coStep === 1 && (
                <>
                  <div className="f-field">
                    <label>Nome de quem recebe</label>
                    <input
                      value={order.dest}
                      onChange={(e) => setOrder({ dest: e.target.value })}
                      placeholder="Ex.: Aline Souza"
                    />
                    <span className={`err${errors.dest ? " show" : ""}`}>
                      Informe o nome do destinatário.
                    </span>
                  </div>
                  <div className="f-row">
                    <div className="f-field">
                      <label>Telefone de contato</label>
                      <input
                        value={order.fone}
                        onChange={(e) => setOrder({ fone: e.target.value })}
                        placeholder="(81) 9 0000-0000"
                      />
                      <span className={`err${errors.fone ? " show" : ""}`}>
                        Informe um telefone.
                      </span>
                    </div>
                    <div className="f-field">
                      <label>Cidade</label>
                      <select
                        value={order.cidade}
                        onChange={(e) => setOrder({ cidade: e.target.value })}
                      >
                        {CIDADES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="f-field">
                    <label>Endereço de entrega</label>
                    <input
                      value={order.end}
                      onChange={(e) => setOrder({ end: e.target.value })}
                      placeholder="Rua, número, bairro, complemento"
                    />
                    <span className={`err${errors.end ? " show" : ""}`}>
                      Informe o endereço completo.
                    </span>
                  </div>
                  <span className="opt-label">Quando entregar?</span>
                  <div className="chips" style={{ margin: "8px 0 14px" }}>
                    <button
                      className={`chip${order.data === "hoje" ? " sel" : ""}`}
                      onClick={() => setOrder({ data: "hoje" })}
                    >
                      Hoje
                    </button>
                    <button
                      className={`chip${order.data === "amanha" ? " sel" : ""}`}
                      onClick={() => setOrder({ data: "amanha" })}
                    >
                      Amanhã
                    </button>
                    <button
                      className={`chip${order.data === "agendar" ? " sel" : ""}`}
                      onClick={() => setOrder({ data: "agendar" })}
                    >
                      Agendar data
                    </button>
                  </div>
                  {order.data === "agendar" && (
                    <div className="f-field">
                      <label>Data desejada</label>
                      <input
                        type="date"
                        value={order.dataAg || ""}
                        onChange={(e) => setOrder({ dataAg: e.target.value })}
                      />
                    </div>
                  )}
                  <span className="opt-label">Período</span>
                  <div className="chips" style={{ marginTop: 8 }}>
                    <button
                      className={`chip${order.periodo === "manha" ? " sel" : ""}`}
                      onClick={() => setOrder({ periodo: "manha" })}
                    >
                      Manhã · 8h–12h
                    </button>
                    <button
                      className={`chip${order.periodo === "tarde" ? " sel" : ""}`}
                      onClick={() => setOrder({ periodo: "tarde" })}
                    >
                      Tarde · 13h–18h
                    </button>
                  </div>
                  <p className="hint" style={{ marginTop: 12 }}>
                    Pedidos confirmados até 16h podem ser entregues hoje mesmo.
                  </p>
                  <div className="co-nav">
                    <button className="btn btn-ghost" onClick={closeCheckout}>
                      Voltar à loja
                    </button>
                    <button className="btn btn-primary" onClick={saveStep1}>
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {coStep === 2 && (
                <>
                  <div className="f-field">
                    <label>Mensagem do cartão (escrita à mão pela nossa equipe)</label>
                    <textarea
                      value={order.msg}
                      onChange={(e) => setOrder({ msg: e.target.value })}
                      placeholder="Ex.: Que estas flores digam o que as palavras não alcançam. Com carinho…"
                    />
                    <span className="hint">
                      Deixe em branco se preferir enviar sem cartão.
                    </span>
                  </div>
                  <div className="f-field">
                    <label>Assinatura (quem envia)</label>
                    <input
                      value={order.de}
                      onChange={(e) => setOrder({ de: e.target.value })}
                      placeholder="Seu nome"
                      disabled={order.anon}
                    />
                  </div>
                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      fontSize: ".88rem",
                      color: "var(--green-soft)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={order.anon}
                      onChange={(e) => setOrder({ anon: e.target.checked })}
                      style={{ accentColor: "var(--green)" }}
                    />
                    Quero enviar como admirador(a) secreto(a) 🤫
                  </label>
                  <div className="co-nav">
                    <button className="btn btn-ghost" onClick={() => setCoStep(1)}>
                      Voltar
                    </button>
                    <button className="btn btn-primary" onClick={saveStep2}>
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {coStep === 3 && (
                <>
                  <label className={`pay-opt${order.pay === "pix" ? " sel" : ""}`}>
                    <input
                      type="radio"
                      name="pay"
                      checked={order.pay === "pix"}
                      onChange={() => setOrder({ pay: "pix" })}
                    />
                    <div>
                      <h4>Pix</h4>
                      <p>
                        Aprovação imediata. Total com desconto: <b>{money(s * 0.95)}</b>
                      </p>
                    </div>
                    <span className="pay-tag">5% off</span>
                  </label>
                  <label
                    className={`pay-opt${order.pay === "cartao" ? " sel" : ""}`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={order.pay === "cartao"}
                      onChange={() => setOrder({ pay: "cartao" })}
                    />
                    <div>
                      <h4>Cartão de crédito</h4>
                      <p>
                        Em até 3x de <b>{money(s / 3)}</b> sem juros
                      </p>
                    </div>
                  </label>
                  {order.pay === "cartao" ? (
                    <div className="card-fields">
                      <div className="f-field">
                        <label>Número do cartão</label>
                        <input
                          value={order.cardNum}
                          onChange={(e) => setOrder({ cardNum: e.target.value })}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                        />
                        <span className={`err${errors.card ? " show" : ""}`}>
                          Preencha os dados do cartão.
                        </span>
                      </div>
                      <div className="f-field">
                        <label>Nome impresso</label>
                        <input
                          value={order.cardNome}
                          onChange={(e) => setOrder({ cardNome: e.target.value })}
                          placeholder="Como está no cartão"
                        />
                      </div>
                      <div className="f-row">
                        <div className="f-field">
                          <label>Validade</label>
                          <input
                            value={order.cardVal}
                            onChange={(e) => setOrder({ cardVal: e.target.value })}
                            placeholder="MM/AA"
                          />
                        </div>
                        <div className="f-field">
                          <label>CVV</label>
                          <input
                            value={order.cardCvv}
                            onChange={(e) => setOrder({ cardCvv: e.target.value })}
                            placeholder="123"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pix-box">
                      <div className="pix-qr" aria-hidden="true" />
                      O QR Code será exibido após a confirmação do pedido.
                      <br />
                      Este é um protótipo — nenhum pagamento é processado.
                    </div>
                  )}
                  <div className="co-nav">
                    <button className="btn btn-ghost" onClick={() => setCoStep(2)}>
                      Voltar
                    </button>
                    <button className="btn btn-primary" onClick={saveStep3}>
                      Revisar pedido
                    </button>
                  </div>
                </>
              )}

              {coStep === 4 && (
                <>
                  <div className="review-box">
                    <span className="edit" onClick={() => setCoStep(1)}>
                      editar
                    </span>
                    <h4>Entrega</h4>
                    <p>
                      <b>{order.dest}</b> · {order.fone}
                      <br />
                      {order.end} — {order.cidade}
                      <br />
                      {dataTxtReview}, período da{" "}
                      {order.periodo === "manha"
                        ? "manhã (8h–12h)"
                        : "tarde (13h–18h)"}
                    </p>
                  </div>
                  <div className="review-box">
                    <span className="edit" onClick={() => setCoStep(2)}>
                      editar
                    </span>
                    <h4>Cartão de mensagem</h4>
                    <p>
                      {order.msg ? (
                        <>
                          “{order.msg}”
                          <br />—{" "}
                          {order.anon
                            ? "Admirador(a) secreto(a)"
                            : order.de || "Sem assinatura"}
                        </>
                      ) : (
                        "Sem cartão de mensagem."
                      )}
                    </p>
                  </div>
                  <div className="review-box">
                    <span className="edit" onClick={() => setCoStep(3)}>
                      editar
                    </span>
                    <h4>Itens & pagamento</h4>
                    <p>
                      {cart.map((c, i) => {
                        const p = productById(c.id);
                        if (!p) return null;
                        return (
                          <span key={`${c.id}-${c.sizeIdx}`}>
                            {c.qty}× {p.name} ({p.sizes[c.sizeIdx].l}) —{" "}
                            {money(itemPrice(c) * c.qty)}
                            {i < cart.length - 1 ? <br /> : null}
                          </span>
                        );
                      })}
                    </p>
                    <p style={{ marginTop: 8 }}>
                      Subtotal {money(subtotal)} · Frete{" "}
                      {frete === 0 ? "grátis" : money(frete)}
                      {order.pay === "pix" ? " · Desconto Pix −5%" : ""}
                    </p>
                    <p
                      style={{
                        fontSize: "1.15rem",
                        color: "var(--ink)",
                        fontWeight: 500,
                        marginTop: 6,
                      }}
                    >
                      Total: {money(total)}{" "}
                      <span
                        style={{
                          fontSize: ".8rem",
                          color: "var(--green-soft)",
                          fontWeight: 300,
                        }}
                      >
                        ({order.pay === "pix" ? "Pix" : "Cartão em até 3x"})
                      </span>
                    </p>
                  </div>
                  <div className="co-nav">
                    <button className="btn btn-ghost" onClick={() => setCoStep(3)}>
                      Voltar
                    </button>
                    <button className="btn btn-primary" onClick={confirmOrder}>
                      Confirmar pedido
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
