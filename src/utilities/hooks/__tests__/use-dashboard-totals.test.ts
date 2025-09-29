import { renderHook } from "@testing-library/react";
import { describe, expect, beforeEach, vi, it } from "vitest";
import type { Mock } from "vitest";

import { useDashboardTotals } from "../use-dashboard-totals";
import { useCustom, useSubscription } from "@refinedev/core";
import type { DashboardTotalCountsQuery } from "@/graphql/types";

vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>(
    "@refinedev/core",
  );

  return {
    ...actual,
    useCustom: vi.fn(),
    useSubscription: vi.fn(),
  };
});

const mockedUseCustom = useCustom as unknown as Mock;
const mockedUseSubscription = useSubscription as unknown as Mock;

describe("useDashboardTotals", () => {
  const totals: DashboardTotalCountsQuery = {
    companies: { totalCount: 10 },
    contacts: { totalCount: 20 },
    deals: { totalCount: 5 },
  } as DashboardTotalCountsQuery;

  beforeEach(() => {
    mockedUseCustom.mockImplementation(() => ({
      data: { data: totals },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }));
    mockedUseSubscription.mockImplementation(() => undefined);
  });

  it("returns aggregated totals from the query", () => {
    const { result } = renderHook(() => useDashboardTotals());

    expect(result.current.totals).toEqual({
      companies: 10,
      contacts: 20,
      deals: 5,
    });
    expect(result.current.isEmpty).toBe(false);
  });

  it("flags empty state when totals are zero", () => {
    mockedUseCustom.mockImplementation(() => ({
      data: {
        data: {
          companies: { totalCount: 0 },
          contacts: { totalCount: 0 },
          deals: { totalCount: 0 },
        },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }));

    const { result } = renderHook(() => useDashboardTotals());

    expect(result.current.totals).toEqual({ companies: 0, contacts: 0, deals: 0 });
    expect(result.current.isEmpty).toBe(true);
  });
});
