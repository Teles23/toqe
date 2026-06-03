import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/shared/hooks/use-auth";
import { normalizeReturnTo } from "@/src/shared/navigation/return-to";

export default function PublicBookingLinkScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const returnTo = normalizeReturnTo(slug ? `/b/${slug}` : null);

  if (!slug || !returnTo) {
    return <Redirect href="/" />;
  }

  if (!user) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/cadastro",
          params: { returnTo },
        }}
      />
    );
  }

  return <Redirect href={`/(cliente)/barbearia/${slug}` as never} />;
}
