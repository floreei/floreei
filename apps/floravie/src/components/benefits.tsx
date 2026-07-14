import { CardIcon, HeartBenefitIcon, TruckIcon } from "./icons";

export function Benefits() {
  return (
    <section className="benefits" aria-label="Vantagens">
      <div className="wrap">
        <div className="benefit">
          <div className="icon">
            <TruckIcon />
          </div>
          <div>
            <h3>Entrega no mesmo dia</h3>
            <p>Pedidos até 16h chegam hoje em Recife e região metropolitana.</p>
          </div>
        </div>
        <div className="benefit">
          <div className="icon">
            <HeartBenefitIcon />
          </div>
          <div>
            <h3>Flores frescas do dia</h3>
            <p>
              Cada peça é montada no ateliê na manhã da entrega, com cartão escrito à
              mão.
            </p>
          </div>
        </div>
        <div className="benefit">
          <div className="icon">
            <CardIcon />
          </div>
          <div>
            <h3>Até 3x sem juros</h3>
            <p>Pague com cartão, Pix ou boleto — parcelamento sem juros no cartão.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
