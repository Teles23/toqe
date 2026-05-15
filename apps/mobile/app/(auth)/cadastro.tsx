import { View, Text, StyleSheet } from "react-native";

/**
 * Tela de cadastro — implementada em mobile/feat/auth
 */
export default function CadastroScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cadastro — em breve</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
  },
});
