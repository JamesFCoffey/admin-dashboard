import { renderHook, act } from '@testing-library/react';

import { useDeals } from '@/utilities/hooks/use-deals';
import { useCreate, useDelete, useSubscription, useUpdate } from '@refinedev/core';
import { useTable } from '@refinedev/antd';

jest.mock('@refinedev/core', () => {
  const actual = jest.requireActual<typeof import('@refinedev/core')>('@refinedev/core');

  return {
    ...actual,
    useCreate: jest.fn(),
    useUpdate: jest.fn(),
    useDelete: jest.fn(),
    useSubscription: jest.fn(),
  };
});

jest.mock('@refinedev/antd', () => {
  const actual = jest.requireActual<typeof import('@refinedev/antd')>('@refinedev/antd');

  return {
    ...actual,
    useTable: jest.fn(),
  };
});

const mockUseTable = useTable as unknown as jest.Mock;
const mockUseCreate = useCreate as unknown as jest.Mock;
const mockUseUpdate = useUpdate as unknown as jest.Mock;
const mockUseDelete = useDelete as unknown as jest.Mock;
const mockUseSubscription = useSubscription as unknown as jest.Mock;

describe('useDeals', () => {
  const baseDeal = {
    id: '1',
    title: 'Enterprise renewal',
    value: 25000,
    createdAt: '2024-01-01T00:00:00.000Z',
    company: {
      id: '1',
      name: 'Dunder Mifflin',
      avatarUrl: null,
    },
    dealOwner: {
      id: '10',
      name: 'Michael Scott',
      avatarUrl: null,
    },
    stage: {
      id: 'stage-1',
      title: 'QUALIFIED',
    },
  } as const;

  const refetchMock = jest.fn().mockResolvedValue({});
  const createMutateMock = jest.fn().mockResolvedValue({});
  const updateMutateMock = jest.fn().mockResolvedValue({});
  const deleteMutateMock = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    mockUseTable.mockReturnValue({
      tableProps: {
        dataSource: [baseDeal],
        pagination: { total: 1 },
        loading: false,
      },
      tableQueryResult: {
        data: { data: [baseDeal] },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: refetchMock,
      },
    });

    mockUseCreate.mockReturnValue({ mutateAsync: createMutateMock, isLoading: false });
    mockUseUpdate.mockReturnValue({ mutateAsync: updateMutateMock, isLoading: false });
    mockUseDelete.mockReturnValue({ mutateAsync: deleteMutateMock, isLoading: false });
    mockUseSubscription.mockReturnValue(undefined);
    refetchMock.mockClear();
    createMutateMock.mockClear();
    updateMutateMock.mockClear();
    deleteMutateMock.mockClear();
  });

  it('creates a deal with the provided payload', async () => {
    const { result } = renderHook(() => useDeals());

    await act(async () => {
      await result.current.createDeal({
        title: 'New deal',
        value: 5000,
        companyId: '1',
        dealOwnerId: '10',
        stageId: 'stage-1',
        company: baseDeal.company,
        dealOwner: baseDeal.dealOwner,
        stage: baseDeal.stage,
      });
    });

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'deals',
        values: expect.objectContaining({
          title: 'New deal',
          companyId: '1',
          dealOwnerId: '10',
        }),
      }),
    );
    expect(refetchMock).toHaveBeenCalled();
  });

  it('updates the deal stage optimistically', async () => {
    const { result } = renderHook(() => useDeals());

    await act(async () => {
      await result.current.updateDealStage('1', 'stage-2', { id: 'stage-2', title: 'WON' });
    });

    expect(updateMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: 'deals',
        id: '1',
        values: expect.objectContaining({ stageId: 'stage-2' }),
      }),
    );
  });

  it('deletes a deal', async () => {
    const { result } = renderHook(() => useDeals());

    await act(async () => {
      await result.current.deleteDeal('1');
    });

    expect(deleteMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ resource: 'deals', id: '1' }),
    );
  });
});
