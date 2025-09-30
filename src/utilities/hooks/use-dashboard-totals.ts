import { useCallback, useMemo } from "react";
import { CrudFilters, HttpError, LiveEvent, useCustom, useSubscription } from "@refinedev/core";

import { DASHBOARD_TOTAL_COUNTS_QUERY } from "@/graphql/queries";
import type { DashboardTotalCountsQuery } from "@/graphql/types";

type DashboardTotals = {
  companies: number;
  contacts: number;
  deals: number;
};

type UseDashboardTotalsResult = {
  totals: DashboardTotals;
  isLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
  isError: boolean;
  error: HttpError | Error | null;
  refetch: () => Promise<unknown>;
};

const DEFAULT_TOTALS: DashboardTotals = {
  companies: 0,
  contacts: 0,
  deals: 0,
};

const SUBSCRIPTION_TYPES: LiveEvent["type"][] = [
  "created",
  "updated",
  "deleted",
];

export const useDashboardTotals = (): UseDashboardTotalsResult => {
  const queryResult = useCustom<DashboardTotalCountsQuery>({
    url: "",
    method: "get",
    meta: {
      gqlQuery: DASHBOARD_TOTAL_COUNTS_QUERY,
    },
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch: refetchTotals,
  } = queryResult;

  const totals = useMemo<DashboardTotals>(() => {
    if (!data?.data) {
      return DEFAULT_TOTALS;
    }

    return {
      companies: data.data.companies.totalCount ?? 0,
      contacts: data.data.contacts.totalCount ?? 0,
      deals: data.data.deals.totalCount ?? 0,
    };
  }, [data?.data]);

  const isRefetching = !isLoading && isFetching;
  const isEmpty = !isLoading && !isError && Object.values(totals).every((count) => count === 0);

  const error = (queryError as HttpError | null) ?? null;
  const hasError = Boolean(error);

  const refetch = useCallback(async () => {
    return refetchTotals();
  }, [refetchTotals]);

  const companiesSubscriptionParams = {
    resource: "companies",
    subscriptionType: "useList" as const,
    filters: [] as CrudFilters,
  };

  console.debug(
    "[useDashboardTotals] subscribing to companies",
    companiesSubscriptionParams,
  );

  useSubscription({
    channel: "resources/companies",
    types: SUBSCRIPTION_TYPES,
    params: companiesSubscriptionParams,
    meta: {
      gqlQuery: DASHBOARD_TOTAL_COUNTS_QUERY,
    },
    onLiveEvent: () => {
      void refetchTotals();
    },
  });

  const contactsSubscriptionParams = {
    resource: "contacts",
    subscriptionType: "useList" as const,
    filters: [] as CrudFilters,
  };

  console.debug(
    "[useDashboardTotals] subscribing to contacts",
    contactsSubscriptionParams,
  );

  useSubscription({
    channel: "resources/contacts",
    types: SUBSCRIPTION_TYPES,
    params: contactsSubscriptionParams,
    meta: {
      gqlQuery: DASHBOARD_TOTAL_COUNTS_QUERY,
    },
    onLiveEvent: () => {
      void refetchTotals();
    },
  });

  const dealsSubscriptionParams = {
    resource: "deals",
    subscriptionType: "useList" as const,
    filters: [] as CrudFilters,
  };

  console.debug(
    "[useDashboardTotals] subscribing to deals",
    dealsSubscriptionParams,
  );

  useSubscription({
    channel: "resources/deals",
    types: SUBSCRIPTION_TYPES,
    params: dealsSubscriptionParams,
    meta: {
      gqlQuery: DASHBOARD_TOTAL_COUNTS_QUERY,
    },
    onLiveEvent: () => {
      void refetchTotals();
    },
  });

  return {
    totals,
    isLoading,
    isRefetching,
    isEmpty,
    isError: hasError,
    error,
    refetch,
  };
};
