import { Redirect, useLocalSearchParams } from "expo-router";

export default function ConviteQueryLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return <Redirect href="/" />;
  }

  return <Redirect href={`/convite/${token}` as never} />;
}

