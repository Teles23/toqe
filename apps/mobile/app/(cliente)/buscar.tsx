import { View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { EmptyScreen, ScreenHeader } from "@/src/shared/ui";

/**
 * Tela "Buscar" do cliente — placeholder até o backend disponibilizar
 * endpoint público `GET /barbearias` (requer campos endereco/lat/lng/
 * avaliacao no model Barbearia + RLS para acesso público anônimo).
 */
export default function ClienteBuscarScreen() {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenHeader title="Buscar" />
      <EmptyScreen
        icon="🔍"
        title="Busca de barbearias em breve"
        description="Estamos preparando a busca por localização, avaliações e disponibilidade. Em breve você poderá descobrir novas barbearias por aqui."
      />
    </View>
  );
}
