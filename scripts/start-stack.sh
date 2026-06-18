#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Levantando Supabase (Docker)..."
npx supabase start

echo "==> Aplicando migraciones y datos de demo..."
npx supabase db reset --yes

ANON_KEY=$(npx supabase status -o json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.ANON_KEY||j.anon_key||'')})")
API_URL=$(npx supabase status -o json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.API_URL||j.api_url||'http://127.0.0.1:54321')})")

cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
EOF

echo "==> Supabase listo en ${API_URL}"
echo "==> Studio: http://127.0.0.1:54323"
echo ""
echo "Para la app en modo desarrollo: npm run dev"
echo "Para la app en Docker:       docker compose up --build"
