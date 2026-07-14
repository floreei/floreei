export function SiteFooter({ whatsapp }: { whatsapp: string | null }) {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-logo">
            <div className="name">
              Flora<em>vie</em>
            </div>
            <div className="tag">Ateliê Floral</div>
            <p>
              Buquês, arranjos e cestas feitos à mão no Recife, entregues com carinho
              no mesmo dia.
            </p>
          </div>
          <div>
            <h4>Institucional</h4>
            <ul>
              <li>
                <a href="#">Quem somos</a>
              </li>
              <li>
                <a href="#">Termos de uso</a>
              </li>
              <li>
                <a href="#">Política de privacidade</a>
              </li>
              <li>
                <a href="#">Trocas e devoluções</a>
              </li>
              <li>
                <a href="#">Corporativo</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ajuda</h4>
            <ul>
              <li>
                <a href="#">Acompanhar pedido</a>
              </li>
              <li>
                <a href="#">Prazos de entrega</a>
              </li>
              <li>
                <a href="#">Formas de pagamento</a>
              </li>
              <li>
                <a href="#">Perguntas frequentes</a>
              </li>
              <li>
                <a href="#">Fale conosco</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contato</h4>
            <ul className="foot-contact">
              <li>WhatsApp: {whatsapp || "(81) 9 0000-0000"}</li>
              <li>contato@floravieatelie.com.br</li>
              <li>Seg a Sáb · 8h às 18h</li>
              <li>Recife · PE</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>Floravie Ateliê © 2026 — Todos os direitos reservados</span>
          <span>CNPJ 00.000.000/0001-00 · Recife, PE</span>
        </div>
      </div>
    </footer>
  );
}
