import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { Perfil } from "@toqe/shared";

const BARBEIRO_PERFIS: Perfil[] = [
  Perfil.BARBEIRO,
  Perfil.DONO,
  Perfil.GERENTE,
  Perfil.RECEPCIONISTA,
  Perfil.SUPER_ADMIN,
];

export default function Index() {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (perfil && BARBEIRO_PERFIS.includes(perfil)) {
    return <Redirect href="/(barbeiro)/agenda" />;
  }

  return <Redirect href="/(cliente)/home" />;
}
