'use client';

import React, { useEffect, useState } from 'react';

interface ClienteRanking {
  codigo: number;
  nome: string;
  email: string;
  pontosAcumulados: number;
}

interface SecaoFidelidadeProps {
  barCodigo: number;
  apiBaseUrl: string;
  token: string;
}

export function SecaoFidelidade({
  barCodigo,
  apiBaseUrl,
  token,
}: SecaoFidelidadeProps) {
  const [clientes, setClientes] = useState<ClienteRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${apiBaseUrl}/fidelidade/ranking?limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': String(barCodigo),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Erro ao buscar ranking: ${res.status}`);
        }
        return res.json() as Promise<ClienteRanking[]>;
      })
      .then(setClientes)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Erro desconhecido'),
      )
      .finally(() => setLoading(false));
  }, [barCodigo, apiBaseUrl, token]);

  return (
    <section style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
        Programa de Fidelidade — Top Clientes
      </h2>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>E-mail</th>
              <th style={thStyle}>Pontos</th>
              <th style={thStyle}>Desconto Disponível</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
                  Nenhum cliente com pontos ainda.
                </td>
              </tr>
            ) : (
              clientes.map((cliente, index) => (
                <tr key={cliente.codigo} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>{cliente.nome}</td>
                  <td style={tdStyle}>{cliente.email}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#0a7ea4' }}>
                    {cliente.pontosAcumulados}
                  </td>
                  <td style={tdStyle}>
                    R$ {(cliente.pontosAcumulados * 0.5).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '14px',
  color: '#111827',
};
