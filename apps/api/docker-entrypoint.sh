#!/bin/sh
set -e

# Aplica migrações pendentes (idempotente) usando o data-source COMPILADO — sem
# ts-node em produção. Depois sobe a API.
echo "→ Aplicando migrações do banco..."
node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

echo "→ Iniciando API..."
exec node dist/main.js
