import { renderHook } from '@testing-library/react';

import { useDealsChartData } from '@/utilities/hooks/use-deals-chart-data';
import { mapDealsData } from '@/utilities/helpers';
import { useList, useSubscription } from '@refinedev/core';
import type { GetFieldsFromList } from '@refinedev/nestjs-query';
import type { DashboardDealsChartQuery } from '@/graphql/types';

jest.mock('@refinedev/core', () => {
  const actual = jest.requireActual<typeof import('@refinedev/core')>('@refinedev/core');

  return {
    ...actual,
    useList: jest.fn(),
    useSubscription: jest.fn(),
  };
});

const mockedUseList = useList as unknown as jest.Mock;
const mockedUseSubscription = useSubscription as unknown as jest.Mock;

type ChartNode = GetFieldsFromList<DashboardDealsChartQuery>;

describe('useDealsChartData', () => {
  const wonDeal: ChartNode = {
    id: 'stage-won',
    title: 'WON',
    dealsAggregate: [
      {
        groupBy: {
          closeDateMonth: 1,
          closeDateYear: 2024,
        },
        sum: {
          value: 5000,
        },
      },
    ],
  };

  const lostDeal: ChartNode = {
    id: 'stage-lost',
    title: 'LOST',
    dealsAggregate: [
      {
        groupBy: {
          closeDateMonth: 2,
          closeDateYear: 2024,
        },
        sum: {
          value: 1500,
        },
      },
    ],
  };

  beforeEach(() => {
    mockedUseList.mockImplementation(() => ({
      data: { data: [wonDeal, lostDeal] },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }));

    mockedUseSubscription.mockImplementation(() => undefined);
  });

  it('maps chart data from deal stages', () => {
    const expected = mapDealsData([wonDeal, lostDeal]);
    const { result } = renderHook(() => useDealsChartData());

    expect(result.current.data).toEqual(expected);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('sets empty state when no data is available', () => {
    mockedUseList.mockImplementation(() => ({
      data: { data: [] },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }));

    const { result } = renderHook(() => useDealsChartData());

    expect(result.current.data).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });
});
