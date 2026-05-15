import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

export default function AgendamentoDetalheScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Agendamento #{codigo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
