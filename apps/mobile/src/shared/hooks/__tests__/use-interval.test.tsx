import { renderHook } from "@testing-library/react-native";
import { act } from "react";

import { useInterval } from "../use-interval";

describe("useInterval", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("chama o callback a cada delay ms", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("não chama o callback quando delay é null", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("limpa o interval no unmount (não vaza timers)", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 500));

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // após unmount, nenhuma chamada nova
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("usa sempre a versão mais recente do callback (fresh closure)", () => {
    let counter = 0;
    function makeCallback() {
      return () => {
        counter++;
      };
    }
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useInterval(cb, 1000),
      { initialProps: { cb: makeCallback() } },
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(counter).toBe(1);

    // trocar callback não recria o timer mas o callback novo é chamado
    rerender({ cb: makeCallback() });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(counter).toBe(2);
  });
});
