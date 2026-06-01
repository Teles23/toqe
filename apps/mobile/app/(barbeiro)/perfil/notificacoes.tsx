import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  useAtualizarPreferenciasNotificacao,
  useNotificacaoPreferencias,
} from "@/src/shared/hooks/perfil/use-notificacao-preferencias";
import { ScreenHeader } from "@/src/shared/ui";

const AMBER = "#F4B400";
const CARD = "#171717";
const BORDER = "#262626";
const BG = "#0d0d0d";
const FG = "#f5f5f5";
const FG3 = "#888888";
const FG4 = "#666666";

// ─── Tipos granulares ─────────────────────────────────────────────────────────
// O hook atual retorna {email, push, whatsapp, sms} (canais simples).
// Para a UI granular, espelhamos em estado local e persistimos via canal ativo
// quando qualquer switch mudar: se qualquer tipo de notificação de um canal está
// ativo, o canal fica true. Se todos estiverem false, o canal fica false.

interface GranularPrefs {
  confirmacao: { push: boolean; whatsapp: boolean; email: boolean };
  lembrete: { push: boolean; whatsapp: boolean; email: boolean };
  cancelamento: { push: boolean; whatsapp: boolean; email: boolean };
  promocoes: { push: boolean; whatsapp: boolean; email: boolean };
}

type TipoKey = keyof GranularPrefs;
type CanalKey = "push" | "whatsapp" | "email";

const TIPOS: { id: TipoKey; label: string; desc: string }[] = [
  {
    id: "confirmacao",
    label: "Confirmação",
    desc: "Quando a barbearia confirma sua reserva",
  },
  {
    id: "lembrete",
    label: "Lembrete 1h",
    desc: "1 hora antes do horário",
  },
  {
    id: "cancelamento",
    label: "Cancelamentos",
    desc: "Se algo for cancelado ou alterado",
  },
  {
    id: "promocoes",
    label: "Promoções",
    desc: "Ofertas exclusivas e novos serviços",
  },
];

function canalAtivo(prefs: GranularPrefs, canal: CanalKey): boolean {
  return TIPOS.some((t) => prefs[t.id][canal]);
}

function buildGranularFromFlat(flat: {
  push: boolean;
  whatsapp: boolean;
  email: boolean;
}): GranularPrefs {
  return {
    confirmacao: {
      push: flat.push,
      whatsapp: flat.whatsapp,
      email: flat.email,
    },
    lembrete: { push: flat.push, whatsapp: flat.whatsapp, email: flat.email },
    cancelamento: {
      push: flat.push,
      whatsapp: flat.whatsapp,
      email: flat.email,
    },
    promocoes: { push: false, whatsapp: false, email: false },
  };
}

export default function PerfilNotificacoesScreen() {
  "use no memo";
  const { data, isLoading, isError } = useNotificacaoPreferencias();
  const atualizar = useAtualizarPreferenciasNotificacao();

  const [prefs, setPrefs] = useState<GranularPrefs | null>(null);

  // Inicializa estado local quando dados chegam
  useEffect(() => {
    if (data && !prefs) {
      setPrefs(
        buildGranularFromFlat({
          push: data.push,
          whatsapp: data.whatsapp,
          email: data.email,
        }),
      );
    }
  }, [data, prefs]);

  const toggle = (tipo: TipoKey, canal: CanalKey) => {
    if (!prefs || !data) return;
    const next: GranularPrefs = {
      ...prefs,
      [tipo]: {
        ...prefs[tipo],
        [canal]: !prefs[tipo][canal],
      },
    };
    setPrefs(next);

    // Persistir: canal ativo = true se pelo menos um tipo estiver ativo
    atualizar.mutate({
      ...data,
      push: canalAtivo(next, "push"),
      whatsapp: canalAtivo(next, "whatsapp"),
      email: canalAtivo(next, "email"),
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      {/* Header */}
      <ScreenHeader
        title="Notificações"
        subtitle="Escolha como ser avisado"
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View style={styles.center} testID="notif-loading">
          <ActivityIndicator color={AMBER} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Não foi possível carregar as preferências.
          </Text>
        </View>
      ) : prefs ? (
        <ScrollView contentContainerStyle={styles.scroll} testID="notif-scroll">
          <Text style={styles.sectionTitle}>COMO AVISAR VOCÊ?</Text>

          {/* Header colunas */}
          <View style={styles.colHeader}>
            <View style={{ flex: 1 }} />
            <Text style={[styles.colLabel, { width: 60 }]}>Push</Text>
            <Text style={[styles.colLabel, { width: 60 }]}>WhatsApp</Text>
            <Text style={[styles.colLabel, { width: 60 }]}>E-mail</Text>
          </View>

          {/* Container de notificações */}
          <View style={styles.notifContainer}>
            {TIPOS.map((tipo, idx) => (
              <View
                key={tipo.id}
                style={[
                  styles.notifRow,
                  idx < TIPOS.length - 1 && styles.notifRowBorder,
                ]}
              >
                {/* Left: label e desc */}
                <View style={styles.notifLeft}>
                  <Text style={styles.notifLabel}>{tipo.label}</Text>
                  <Text style={styles.notifDesc}>{tipo.desc}</Text>
                </View>

                {/* Switches */}
                <View style={[styles.switchCell, { width: 60 }]}>
                  <Switch
                    testID={`notif-${tipo.id}-push`}
                    value={prefs[tipo.id].push}
                    onValueChange={() => toggle(tipo.id, "push")}
                    trackColor={{ true: AMBER, false: BORDER }}
                    thumbColor="#ffffff"
                  />
                </View>
                <View style={[styles.switchCell, { width: 60 }]}>
                  <Switch
                    testID={`notif-${tipo.id}-whatsapp`}
                    value={prefs[tipo.id].whatsapp}
                    onValueChange={() => toggle(tipo.id, "whatsapp")}
                    trackColor={{ true: AMBER, false: BORDER }}
                    thumbColor="#ffffff"
                  />
                </View>
                <View style={[styles.switchCell, { width: 60 }]}>
                  <Switch
                    testID={`notif-${tipo.id}-email`}
                    value={prefs[tipo.id].email}
                    onValueChange={() => toggle(tipo.id, "email")}
                    trackColor={{ true: AMBER, false: BORDER }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: FG3,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: FG4,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  colHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  colLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: FG4,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  notifContainer: {
    backgroundColor: CARD,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notifRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  notifLeft: {
    flex: 1,
    paddingRight: 8,
  },
  notifLabel: {
    fontSize: 13,
    color: FG,
    fontFamily: "Inter_500Medium",
  },
  notifDesc: {
    fontSize: 11,
    color: FG3,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  switchCell: {
    alignItems: "center",
    justifyContent: "center",
  },
});
