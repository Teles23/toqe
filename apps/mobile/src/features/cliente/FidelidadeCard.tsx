import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';

interface PontoFidelidade {
  codigo: number;
  pontos: number;
  tipo: 'ganho' | 'resgate';
  criadoEm: string;
}

interface SaldoFidelidade {
  pontos: number;
  historico: PontoFidelidade[];
}

interface FidelidadeCardProps {
  clienteCodigo: number;
  barCodigo: number;
  apiBaseUrl: string;
  token: string;
}

export function FidelidadeCard({
  clienteCodigo,
  barCodigo,
  apiBaseUrl,
  token,
}: FidelidadeCardProps) {
  const [saldo, setSaldo] = useState<SaldoFidelidade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaldo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/fidelidade/saldo/${clienteCodigo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': String(barCodigo),
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Erro ao buscar saldo: ${response.status}`);
      }
      const data: SaldoFidelidade = await response.json();
      setSaldo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [clienteCodigo, barCodigo, apiBaseUrl, token]);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo]);

  const handleResgatar = () => {
    Alert.prompt(
      'Resgatar Pontos',
      `Você tem ${saldo?.pontos ?? 0} pontos. Quantos deseja resgatar? (mínimo 10)`,
      async (valor) => {
        const pontos = parseInt(valor ?? '0', 10);
        if (isNaN(pontos) || pontos < 10) {
          Alert.alert('Erro', 'Mínimo de 10 pontos para resgate.');
          return;
        }
        try {
          const response = await fetch(`${apiBaseUrl}/fidelidade/resgatar`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'x-tenant-id': String(barCodigo),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clienteCodigo, pontos }),
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message ?? 'Erro ao resgatar pontos');
          }
          const resultado: { desconto: number } = await response.json();
          Alert.alert(
            'Resgate realizado!',
            `Desconto de R$ ${resultado.desconto.toFixed(2)} aplicado.`,
          );
          fetchSaldo();
        } catch (err) {
          Alert.alert(
            'Erro',
            err instanceof Error ? err.message : 'Erro ao resgatar',
          );
        }
      },
      'plain-text',
    );
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#0a7ea4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchSaldo}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Programa de Fidelidade</Text>
      <Text style={styles.pontos}>{saldo?.pontos ?? 0} pontos</Text>
      <Text style={styles.hint}>R$ {((saldo?.pontos ?? 0) * 0.5).toFixed(2)} em desconto disponível</Text>
      <TouchableOpacity
        style={[styles.button, (saldo?.pontos ?? 0) < 10 && styles.buttonDisabled]}
        onPress={handleResgatar}
        disabled={(saldo?.pontos ?? 0) < 10}
      >
        <Text style={styles.buttonText}>Resgatar Pontos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  pontos: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0a7ea4',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#687076',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9BA1A6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 12,
  },
});
