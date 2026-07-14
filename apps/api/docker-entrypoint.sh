#!/bin/sh
set -e

# Aplica migrações pendentes (idempotente) usando o data-source COMPILADO — sem
# ts-node em produção. Depois sobe a API.
echo "→ Aplicando migrações do banco..."
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

# Bootstrap opcional da loja Floravie (cria a empresa + vincula o admin). É
# idempotente e barato quando já feito. Ligue CONNECT_FLORAVIE=true no primeiro
# deploy; depois pode remover. Nunca bloqueia o boot da API.
if [ "$CONNECT_FLORAVIE" = "true" ]; then
  echo "→ Conectando a Floravie (idempotente)..."
  node dist/database/connect-floravie.js || echo "⚠ connect:floravie falhou — seguindo o boot da API."
fi

echo "→ Iniciando API..."
exec node dist/main.js
