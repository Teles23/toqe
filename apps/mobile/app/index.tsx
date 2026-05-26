import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import type { BarbeariaResumo } from "@toqe/shared";
import { Perfil } from "@toqe/shared";

const BARBEIRO_PERFIS: Perfil[] = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

function getRouteForPerfil(perfil: Perfil | null): string {
  return perfil && BARBEIRO_PERFIS.includes(perfil)
    ? "/(barbeiro)/agenda"
    : "/(cliente)/home";
}

// ─── SplashTenantPicker ──────────────────────────────────────────────────────

function SplashTenantPicker() {
  const { user, barbearias, switchBarbearia } = useAuth();

  const handleSelect = (b: BarbeariaResumo) => {
    switchBarbearia(b.codigo);
    router.replace(getRouteForPerfil(b.perfil) as never);
  };

  return (
    <View testID="tenant-picker" style={styles.pickerContainer}>
      {/* Saudação */}
      <View style={styles.pickerGreeting}>
        <Text style={styles.pickerHello}>
          Oi, {user?.nome?.split(" ")[0] ?? "você"}.
        </Text>
        <Text style={styles.pickerSubtitle}>Onde vamos hoje?</Text>
      </View>

      {/* Lista de barbearias */}
      <FlatList
        data={barbearias}
        keyExtractor={(b) => String(b.codigo)}
        style={styles.pickerList}
        contentContainerStyle={styles.pickerListContent}
        renderItem={({ item: b }) => {
          const letra = b.nome.trim()[0]?.toUpperCase() ?? "?";
          return (
            <Pressable
              testID={`tenant-card-${b.codigo}`}
              accessibilityRole="button"
              accessibilityLabel={`Entrar em ${b.nome}`}
              onPress={() => handleSelect(b)}
              style={styles.tenantCard}
            >
              {/* Logo */}
              <View style={styles.tenantLogo}>
                <Text style={styles.tenantLogoLetter}>{letra}</Text>
              </View>
              {/* Info */}
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantNome} numberOfLines={1}>
                  {b.nome}
                </Text>
                <Text style={styles.tenantPerfil}>
                  {b.perfil.toLowerCase()}
                </Text>
              </View>
              {/* Chevron */}
              <Text style={styles.tenantChevron}>›</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Pressable
            testID="btn-entrar-outra"
            accessibilityRole="button"
            accessibilityLabel="Entrar em outra barbearia"
            onPress={() => router.push("/(cliente)/buscar" as never)}
            style={styles.outlineDashedBtn}
          >
            <Text style={styles.outlineDashedText}>
              + Entrar em outra barbearia
            </Text>
          </Pressable>
        }
      />
    </View>
  );
}

// ─── Root index ──────────────────────────────────────────────────────────────

export default function Index() {
  const { user, perfil, barbearias, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  // Não autenticado
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Sem barbearia vinculada — vai para home (exibe EmptyClienteSemBarbearia)
  if (barbearias.length === 0) {
    return <Redirect href="/(cliente)/home" />;
  }

  // Uma única barbearia — redireciona direto
  if (barbearias.length === 1) {
    return <Redirect href={getRouteForPerfil(perfil) as never} />;
  }

  // Múltiplas barbearias — exibe SplashTenantPicker
  return <SplashTenantPicker />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
  },
  // ── SplashTenantPicker
  pickerContainer: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 24,
  },
  pickerGreeting: {
    paddingTop: 60,
    marginBottom: 32,
  },
  pickerHello: {
    fontFamily: "Sora_700Bold",
    fontSize: 24,
    color: "#f5f5f5",
  },
  pickerSubtitle: {
    fontSize: 16,
    color: "#888888",
    marginTop: 4,
  },
  pickerList: {
    flex: 1,
  },
  pickerListContent: {
    paddingBottom: 16,
  },
  tenantCard: {
    backgroundColor: "#171717",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tenantLogo: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F4B400",
    alignItems: "center",
    justifyContent: "center",
  },
  tenantLogoLetter: {
    fontFamily: "Sora_700Bold",
    fontSize: 22,
    color: "#0d0d0d",
  },
  tenantInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tenantNome: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    color: "#f5f5f5",
  },
  tenantPerfil: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
  tenantChevron: {
    fontSize: 16,
    color: "#444444",
  },
  outlineDashedBtn: {
    borderWidth: 1,
    borderColor: "#262626",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  outlineDashedText: {
    fontSize: 13,
    color: "#888888",
    fontFamily: "Inter_500Medium",
  },
});
