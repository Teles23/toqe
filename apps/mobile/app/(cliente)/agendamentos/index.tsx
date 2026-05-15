import { View, Text, StyleSheet } from "react-native";

export default function AgendamentosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Meus Agendamentos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
