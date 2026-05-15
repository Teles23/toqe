import { View, Text, StyleSheet } from "react-native";

export default function ClientePerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Perfil — Cliente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
