import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seja bem-vindo",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
