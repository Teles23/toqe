import { View, Text, StyleSheet } from "react-native";

export default function ClienteHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Início — Cliente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
