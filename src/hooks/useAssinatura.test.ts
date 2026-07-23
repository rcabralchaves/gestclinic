/**
 * ARQUIVO TEMPORÁRIO DE VALIDAÇÃO — Fase 3.3
 * Propósito: validar o hook useAssinatura em isolamento.
 * Pode ser removido após aprovação da arquitetura.
 *
 * Não importado por nenhum componente de produção.
 * Não afeta nenhuma rota ou tela existente.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssinatura } from "./useAssinatura";

// ── Mocks hoisted ────────────────────────────────────────────
// vi.hoisted garante que as variáveis estejam disponíveis
// quando vi.mock() é içado ao topo do arquivo pelo compilador.
const { mockMaybySingle, mockUseAuthReturn } = vi.hoisted(() => ({
  mockMaybySingle: vi.fn(),
  mockUseAuthReturn: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            maybeSingle: mockMaybySingle,
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthReturn(),
}));

// ── Fixtures ─────────────────────────────────────────────────
const USER_ID = "00000000-0000-0000-0000-000000000001";

const SUBSCRIPTION_TRIAL = {
  id: "sub-001",
  user_id: USER_ID,
  plano: "completo",
  status: "trial",
  trial_expira_em: "2026-08-06T00:00:00Z",
  periodo_inicio: null,
  periodo_fim: null,
  cancelado_em: null,
  cancelamento_motivo: null,
  gateway_customer_id: null,
  gateway_subscription_id: null,
  gateway_price_id: null,
  ultimo_evento_gateway: null,
  created_at: "2026-07-23T00:00:00Z",
  updated_at: "2026-07-23T00:00:00Z",
};

const SUBSCRIPTION_ATIVO = {
  ...SUBSCRIPTION_TRIAL,
  status: "ativo",
  trial_expira_em: null,
  periodo_inicio: "2026-07-23T00:00:00Z",
  periodo_fim: "2026-08-23T00:00:00Z",
  gateway_customer_id: "cus_test_001",
  gateway_subscription_id: "sub_test_001",
  gateway_price_id: "price_test_001",
};

const SUBSCRIPTION_INADIMPLENTE = {
  ...SUBSCRIPTION_ATIVO,
  status: "inadimplente",
};

// ── Testes ───────────────────────────────────────────────────
describe("useAssinatura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Cenário 1: usuário sem assinatura ────────────────────
  it("não quebra quando o usuário não tem assinatura", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toBeNull();
    expect(result.current.status).toBeNull();
    expect(result.current.plano).toBeNull();
    expect(result.current.trialExpiraEm).toBeNull();
    expect(result.current.periodoInicio).toBeNull();
    expect(result.current.periodoFim).toBeNull();
    expect(result.current.error).toBeNull();

    // Todas as flags devem ser false
    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAtivo).toBe(false);
    expect(result.current.isInadimplente).toBe(false);
    expect(result.current.isCancelado).toBe(false);
    expect(result.current.isExpirado).toBe(false);
  });

  // ── Cenário 2: usuário em trial ──────────────────────────
  it("identifica corretamente uma assinatura em trial", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: SUBSCRIPTION_TRIAL, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toEqual(SUBSCRIPTION_TRIAL);
    expect(result.current.status).toBe("trial");
    expect(result.current.plano).toBe("completo");
    expect(result.current.trialExpiraEm).toBe("2026-08-06T00:00:00Z");

    expect(result.current.isTrial).toBe(true);
    expect(result.current.isAtivo).toBe(false);
    expect(result.current.isInadimplente).toBe(false);
    expect(result.current.isCancelado).toBe(false);
    expect(result.current.isExpirado).toBe(false);
  });

  // ── Cenário 3: assinatura ativa (paga) ───────────────────
  it("identifica corretamente uma assinatura ativa", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: SUBSCRIPTION_ATIVO, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBe("ativo");
    expect(result.current.periodoInicio).toBe("2026-07-23T00:00:00Z");
    expect(result.current.periodoFim).toBe("2026-08-23T00:00:00Z");

    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAtivo).toBe(true);
    expect(result.current.isInadimplente).toBe(false);
    expect(result.current.isCancelado).toBe(false);
    expect(result.current.isExpirado).toBe(false);
  });

  // ── Cenário 4: assinatura inadimplente ───────────────────
  it("identifica corretamente uma assinatura inadimplente", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: SUBSCRIPTION_INADIMPLENTE, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBe("inadimplente");

    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAtivo).toBe(false);
    expect(result.current.isInadimplente).toBe(true);
    expect(result.current.isCancelado).toBe(false);
    expect(result.current.isExpirado).toBe(false);
  });

  // ── Cenário 5: usuário não autenticado ───────────────────
  it("não faz query quando não há usuário autenticado", async () => {
    mockUseAuthReturn.mockReturnValue({ user: null, loading: false });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // maybeSingle não deve ter sido chamado
    expect(mockMaybySingle).not.toHaveBeenCalled();

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── Cenário 6: ainda carregando auth ─────────────────────
  it("permanece em loading enquanto auth não terminou", () => {
    mockUseAuthReturn.mockReturnValue({ user: null, loading: true });

    const { result } = renderHook(() => useAssinatura());

    // loading ainda true — auth não concluiu
    expect(result.current.loading).toBe(true);
    expect(mockMaybySingle).not.toHaveBeenCalled();
  });

  // ── Cenário 7: erro do banco ─────────────────────────────
  it("trata erro do banco sem quebrar", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({
      data: null,
      error: { message: "relation \"subscriptions\" does not exist" },
    });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBe("relation \"subscriptions\" does not exist");

    // Flags todas false — sistema degradado graciosamente
    expect(result.current.isTrial).toBe(false);
    expect(result.current.isAtivo).toBe(false);
  });

  // ── Cenário 8: refresh() força nova leitura ───────────────
  it("refresh() dispara nova query ao banco", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockMaybySingle).toHaveBeenCalledTimes(1);

    // Simula chegada de webhook: subscription criada
    mockMaybySingle.mockResolvedValue({ data: SUBSCRIPTION_TRIAL, error: null });

    result.current.refresh();

    await waitFor(() => expect(result.current.subscription).not.toBeNull());
    expect(mockMaybySingle).toHaveBeenCalledTimes(2);
    expect(result.current.isTrial).toBe(true);
  });

  // ── Cenário 9: nenhum dado sensível exposto além do próprio user ──
  it("não expõe dados de gateway quando assinatura é null", async () => {
    mockUseAuthReturn.mockReturnValue({ user: { id: USER_ID }, loading: false });
    mockMaybySingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAssinatura());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Campos de gateway só existem dentro de subscription (null aqui)
    expect(result.current.subscription?.gateway_customer_id).toBeUndefined();
    expect(result.current.subscription?.gateway_subscription_id).toBeUndefined();
  });
});
