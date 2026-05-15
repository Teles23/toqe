import { View, Text, StyleSheet } from "react-native";

/**
 * Tela de login — implementada em mobile/feat/auth
 */
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login — em breve</Text>
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
