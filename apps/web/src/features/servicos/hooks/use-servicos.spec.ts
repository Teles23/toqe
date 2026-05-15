import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useServicos, useServicoMutations } from "./use-servicos";
import { createWrapper } from "@/test/render-helpers";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock("../services/servico.service", () => ({
  servicoService: {
    list: (...args: unknown[]) => mockList(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

describe("useServicos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be disabled when barCodigo is null", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicos(null), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockList).not.toHaveBeenCalled();
  });

  it("should fetch data when barCodigo is provided", async () => {
    const mockData = [
      { codigo: 1, nome: "Corte", precoBase: 25, duracaoBase: 30, ativo: true },
    ];
    mockList.mockResolvedValueOnce(mockData);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicos(1), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockList).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(mockData);
  });
});

describe("useServicoMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create mutation calls servicoService.create and invalidates query on success", async () => {
    const created = {
      codigo: 99,
      barCodigo: 1,
      nome: "Novo",
      precoBase: 40,
      duracaoBase: 30,
      ativo: true,
    };
    mockCreate.mockResolvedValueOnce(created);
    mockList.mockResolvedValue([created]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicoMutations(1), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.create.mutate({
        nome: "Novo",
        precoBase: 40,
        duracaoBase: 30,
      });
    });

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    expect(mockCreate).toHaveBeenCalledWith(1, {
      nome: "Novo",
      precoBase: 40,
      duracaoBase: 30,
    });
  });

  it("update mutation calls servicoService.update with barCodigo and codigo", async () => {
    const updated = {
      codigo: 1,
      barCodigo: 1,
      nome: "Corte Plus",
      precoBase: 50,
      duracaoBase: 30,
      ativo: true,
    };
    mockUpdate.mockResolvedValueOnce(updated);
    mockList.mockResolvedValue([updated]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicoMutations(1), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.update.mutate({
        codigo: 1,
        data: { nome: "Corte Plus", precoBase: 50 },
      });
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith(1, 1, {
      nome: "Corte Plus",
      precoBase: 50,
    });
  });

  it("remove mutation calls servicoService.remove with barCodigo and codigo", async () => {
    mockRemove.mockResolvedValueOnce(undefined);
    mockList.mockResolvedValue([]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicoMutations(1), {
      wrapper: Wrapper,
    });

    await act(async () => {
      result.current.remove.mutate(1);
    });

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    expect(mockRemove).toHaveBeenCalledWith(1, 1);
  });

  it("does nothing when barCodigo is null", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useServicoMutations(null), {
      wrapper: Wrapper,
    });

    expect(result.current.create.isPending).toBe(false);
    expect(result.current.update.isPending).toBe(false);
    expect(result.current.remove.isPending).toBe(false);
  });
});
