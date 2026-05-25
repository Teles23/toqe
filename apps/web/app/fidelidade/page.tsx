import { SecaoFidelidade } from '../../src/features/configuracoes/components/SecaoFidelidade';

// Em produção esses valores viriam de server-side session / cookies
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function FidelidadePage() {
  return (
    <main>
      <SecaoFidelidade
        barCodigo={1}
        apiBaseUrl={API_BASE_URL}
        token=""
      />
    </main>
  );
}
