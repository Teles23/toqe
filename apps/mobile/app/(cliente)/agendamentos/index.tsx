import { View } from "react-native";

import { useTheme } from "@/src/shared/theme";
import { EmptyScreen, ScreenHeader } from "@/src/shared/ui";

/**
 * Tela "Meus agendamentos" do cliente — placeholder até o backend permitir
 * que a role `cliente` acesse `GET /agendamentos` (atualmente restrito a
 * roles de barbearia). O detalhe individual (`GET /agendamentos/:codigo`)
 * já é acessível ao cliente — usado em `[codigo].tsx`.
 */
export default function ClienteAgendamentosScreen() {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenHeader title="Meus agendamentos" />
      <EmptyScreen
        icon="📅"
        title="Em breve"
        description="A listagem de agendamentos do cliente está sendo finalizada. Por enquanto, você pode acessar agendamentos individuais via link compartilhado."
      />
    </View>
  );
}
