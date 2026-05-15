import { View, Text, StyleSheet } from "react-native";

export default function BuscarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Buscar barbearias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
