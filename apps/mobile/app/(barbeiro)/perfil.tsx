import { View, Text, StyleSheet } from "react-native";

export default function BarbeiroPerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Perfil — Barbeiro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
