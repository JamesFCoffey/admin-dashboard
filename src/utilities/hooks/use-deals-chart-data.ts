import { useCallback, useMemo } from "react";
import { HttpError, LiveEvent, useList, useSubscription } from "@refinedev/core";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import { DASHBOARD_DEALS_CHART_QUERY } from "@/graphql/queries";
import type { DashboardDealsChartQuery } from "@/graphql/types";
import { mapDealsData } from "@/utilities/helpers";

export type DealsChartDatum = ReturnType<typeof mapDealsData>[number];

export type UseDealsChartDataResult = {
  data: DealsChartDatum[];
  isLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
  isError: boolean;
  error: HttpError | Error | null;
  refetch: () => Promise<unknown>;
};

const SUBSCRIPTION_TYPES: LiveEvent["type"][] = [
  "created",
  "updated",
  "deleted",
];

export const useDealsChartData = (): UseDealsChartDataResult => {
  const queryResult = useList<GetFieldsFromList<DashboardDealsChartQuery>>({
    resource: "dealStages",
    filters: [
      {
        field: "title",
        operator: "in",
        value: ["WON", "LOST"],
      },
    ],
    meta: {
      gqlQuery: DASHBOARD_DEALS_CHART_QUERY,
    },
    liveMode: "manual",
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch: refetchDeals,
  } = queryResult;

  const chartData = useMemo(() => {
    return mapDealsData(data?.data);
  }, [data?.data]);

  const isRefetching = !isLoading && isFetching;
  const isEmpty = !isLoading && !isError && chartData.length === 0;

  const error = (queryError as HttpError | null) ?? null;
  const hasError = Boolean(error);

  const refetch = useCallback(async () => {
    return refetchDeals();
  }, [refetchDeals]);

  const dealsSubscriptionParams = {
    resource: "deals",
    subscriptionType: "useList",
    filters: [
      {
        field: "title",
        operator: "in",
        value: ["WON", "LOST"],
      },
    ],
  };

  console.debug(
    "[useDealsChartData] subscribing to deals",
    dealsSubscriptionParams,
  );

  useSubscription({
    channel: "resources/deals",
    types: SUBSCRIPTION_TYPES,
    params: dealsSubscriptionParams,
    meta: {
      gqlQuery: DASHBOARD_DEALS_CHART_QUERY,
    },
    onLiveEvent: () => {
      void refetchDeals();
    },
  });

  const dealStagesSubscriptionParams = {
    resource: "dealStages",
    subscriptionType: "useList",
    filters: [
      {
        field: "title",
        operator: "in",
        value: ["WON", "LOST"],
      },
    ],
  };

  console.debug(
    "[useDealsChartData] subscribing to dealStages",
    dealStagesSubscriptionParams,
  );

  useSubscription({
    channel: "resources/dealStages",
    types: SUBSCRIPTION_TYPES,
    params: dealStagesSubscriptionParams,
    meta: {
      gqlQuery: DASHBOARD_DEALS_CHART_QUERY,
    },
    onLiveEvent: () => {
      void refetchDeals();
    },
  });

  return {
    data: chartData,
    isLoading,
    isRefetching,
    isEmpty,
    isError: hasError,
    error,
    refetch,
  };
};
