import { render, screen } from "@testing-library/react-native";
import React from "react";

import { SkeletonBox } from "../SkeletonBox";

describe("SkeletonBox", () => {
  it("renderiza com largura e altura fixas", () => {
    render(<SkeletonBox width={200} height={20} />);
    expect(screen.getByTestId("skeleton-box")).toBeTruthy();
  });

  it("renderiza com largura percentual", () => {
    render(<SkeletonBox width="100%" height={40} />);
    expect(screen.getByTestId("skeleton-box")).toBeTruthy();
  });

  it("respeita testID customizado", () => {
    render(<SkeletonBox width={100} height={10} testID="agenda-skeleton" />);
    expect(screen.getByTestId("agenda-skeleton")).toBeTruthy();
  });

  it("respeita borderRadius customizado sem crash", () => {
    render(<SkeletonBox width={100} height={10} borderRadius={20} />);
    expect(screen.getByTestId("skeleton-box")).toBeTruthy();
  });
});
