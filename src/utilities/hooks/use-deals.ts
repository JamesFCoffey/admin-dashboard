import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useTable } from '@refinedev/antd';
import {
  CrudFilters,
  HttpError,
  LiveEvent,
  useCreate,
  useDelete,
  useSubscription,
  useUpdate,
} from '@refinedev/core';
import { GetFieldsFromList } from '@refinedev/nestjs-query';

import {
  CREATE_DEAL_MUTATION,
  DELETE_DEAL_MUTATION,
  UPDATE_DEAL_MUTATION,
} from '@/graphql/mutations';
import { DEALS_LIST_QUERY } from '@/graphql/queries';
import type {
  CreateDealMutation,
  DealsListQuery,
  DeleteDealMutation,
  UpdateDealMutation,
} from '@/graphql/types';
import { logger } from '@/utilities/logger';

type DealRecord = GetFieldsFromList<DealsListQuery>;

export type DealFormValues = {
  title: string;
  value?: number | null;
  companyId: string;
  dealOwnerId: string;
  stageId?: string | null;
};

export type DealUpsertPayload = DealFormValues & {
  company?: DealRecord['company'];
  dealOwner?: DealRecord['dealOwner'];
  stage?: DealRecord['stage'];
};

type OptimisticDeal = DealRecord & { __optimistic: true };

type PendingDealsState = {
  created: Record<string, OptimisticDeal>;
  updated: Record<string, DealRecord>;
  deleted: Set<string>;
};

const DEAL_SUBSCRIPTION_TYPES: LiveEvent['type'][] = ['created', 'updated', 'deleted'];

export const useDeals = () => {
  const { tableProps, tableQueryResult } = useTable<DealRecord>({
    resource: 'deals',
    syncWithLocation: false,
    sorters: {
      initial: [
        {
          field: 'createdAt',
          order: 'desc',
        },
      ],
    },
    filters: {
      initial: [
        {
          field: 'title',
          operator: 'contains' as const,
          value: '',
        },
        {
          field: 'company.name',
          operator: 'contains' as const,
          value: '',
        },
      ],
    },
    pagination: {
      pageSize: 10,
    },
    meta: {
      gqlQuery: DEALS_LIST_QUERY,
    },
    liveMode: 'manual',
  });

  const { mutateAsync: createDealMutateAsync, isLoading: isCreateLoading } = useCreate<
    CreateDealMutation,
    HttpError
  >();
  const { mutateAsync: updateDealMutateAsync, isLoading: isUpdateLoading } = useUpdate<
    UpdateDealMutation,
    HttpError
  >();
  const { mutateAsync: deleteDealMutateAsync, isLoading: isDeleteLoading } = useDelete<
    DeleteDealMutation,
    HttpError
  >();

  const [pending, setPending] = useState<PendingDealsState>(() => ({
    created: {},
    updated: {},
    deleted: new Set<string>(),
  }));

  useEffect(() => {
    setPending({
      created: {},
      updated: {},
      deleted: new Set<string>(),
    });
  }, []);

  const baseDeals = (tableProps?.dataSource as DealRecord[] | undefined) ?? [];

  const deals = useMemo<DealRecord[]>(() => {
    const optimisticCreates = Object.values(pending.created);
    const optimisticUpdates = pending.updated;
    const optimisticDeletes = pending.deleted;

    const hydratedBase = baseDeals
      .filter((deal) => !optimisticDeletes.has(String(deal.id)))
      .map((deal) => {
        const updated = optimisticUpdates[String(deal.id)];
        if (!updated) {
          return deal;
        }

        return {
          ...deal,
          ...updated,
        };
      });

    return [...optimisticCreates, ...hydratedBase];
  }, [baseDeals, pending.created, pending.deleted, pending.updated]);

  const paginationConfig = tableProps?.pagination;
  const baseTotal =
    paginationConfig && typeof paginationConfig === 'object' && 'total' in paginationConfig
      ? (paginationConfig.total ?? baseDeals.length)
      : baseDeals.length;
  const totalCount = baseTotal + Object.keys(pending.created).length - pending.deleted.size;

  const isLoading = tableQueryResult?.isLoading ?? false;
  const isFetching = tableQueryResult?.isFetching ?? false;
  const isRefetching = !isLoading && isFetching;
  const error = (tableQueryResult?.error as HttpError | null) ?? null;
  const isError = Boolean(error);

  const refetch = useCallback(async () => {
    if (tableQueryResult?.refetch) {
      return tableQueryResult.refetch();
    }

    return Promise.resolve();
  }, [tableQueryResult]);

  const removeOptimisticCreate = useCallback((optimisticId: string) => {
    setPending((previous) => {
      if (!(optimisticId in previous.created)) {
        return previous;
      }

      const nextCreated = { ...previous.created };
      delete nextCreated[optimisticId];

      return {
        ...previous,
        created: nextCreated,
      };
    });
  }, []);

  const removeOptimisticUpdate = useCallback((dealId: string) => {
    setPending((previous) => {
      if (!(dealId in previous.updated)) {
        return previous;
      }

      const nextUpdated = { ...previous.updated };
      delete nextUpdated[dealId];

      return {
        ...previous,
        updated: nextUpdated,
      };
    });
  }, []);

  const removeOptimisticDelete = useCallback((dealId: string) => {
    setPending((previous) => {
      if (!previous.deleted.has(dealId)) {
        return previous;
      }

      const nextDeleted = new Set(previous.deleted);
      nextDeleted.delete(dealId);

      return {
        ...previous,
        deleted: nextDeleted,
      };
    });
  }, []);

  const createDeal = useCallback(
    async ({ company, dealOwner, stage, value, ...values }: DealUpsertPayload) => {
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const optimisticDeal: OptimisticDeal = {
        id: optimisticId,
        title: values.title,
        value: value ?? 0,
        createdAt: new Date().toISOString(),
        company: company as DealRecord['company'],
        dealOwner: dealOwner as DealRecord['dealOwner'],
        stage: stage ?? null,
        __optimistic: true,
      } as OptimisticDeal;

      setPending((previous) => ({
        ...previous,
        created: {
          ...previous.created,
          [optimisticId]: optimisticDeal,
        },
      }));

      try {
        await createDealMutateAsync({
          resource: 'deals',
          values: {
            ...values,
            value: value ?? 0,
          },
          meta: {
            gqlMutation: CREATE_DEAL_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticCreate(optimisticId);
      }
    },
    [createDealMutateAsync, removeOptimisticCreate, tableQueryResult],
  );

  const updateDeal = useCallback(
    async (id: string, { company, dealOwner, stage, value, ...values }: DealUpsertPayload) => {
      const dealId = String(id);
      const existing = deals.find((deal) => String(deal.id) === dealId) ?? null;
      const baseDeal = (existing ?? {}) as Partial<DealRecord>;

      const optimisticDeal: DealRecord = {
        ...baseDeal,
        id: dealId,
        title: values.title,
        value: value ?? existing?.value ?? 0,
        createdAt: baseDeal.createdAt ?? new Date().toISOString(),
        company: (company ?? existing?.company) as DealRecord['company'],
        dealOwner: (dealOwner ?? existing?.dealOwner) as DealRecord['dealOwner'],
        stage: stage ?? existing?.stage ?? null,
      } as DealRecord;

      setPending((previous) => ({
        ...previous,
        updated: {
          ...previous.updated,
          [dealId]: optimisticDeal,
        },
      }));

      try {
        await updateDealMutateAsync({
          resource: 'deals',
          id,
          values: {
            ...values,
            value: value ?? existing?.value ?? 0,
            stageId: stage?.id ?? values.stageId ?? existing?.stage?.id ?? null,
          },
          meta: {
            gqlMutation: UPDATE_DEAL_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticUpdate(dealId);
      }
    },
    [deals, removeOptimisticUpdate, tableQueryResult, updateDealMutateAsync],
  );

  const updateDealStage = useCallback(
    async (id: string, stageId: string | null, stage?: DealRecord['stage']) => {
      const dealId = String(id);
      const existing = deals.find((deal) => String(deal.id) === dealId);

      if (!existing) {
        return;
      }

      const optimisticDeal: DealRecord = {
        ...existing,
        stage: stage ?? existing.stage ?? null,
      } as DealRecord;

      setPending((previous) => ({
        ...previous,
        updated: {
          ...previous.updated,
          [dealId]: optimisticDeal,
        },
      }));

      try {
        const nextStage = stage ?? existing.stage ?? null;
        const title = nextStage?.title?.toUpperCase();
        const shouldSetCloseDate = title === 'WON' || title === 'LOST';
        const now = dayjs();
        await updateDealMutateAsync({
          resource: 'deals',
          id,
          values: {
            stageId,
            closeDateDay: shouldSetCloseDate ? now.date() : null,
            closeDateMonth: shouldSetCloseDate ? now.month() + 1 : null,
            closeDateYear: shouldSetCloseDate ? now.year() : null,
          },
          meta: {
            gqlMutation: UPDATE_DEAL_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticUpdate(dealId);
      }
    },
    [deals, removeOptimisticUpdate, tableQueryResult, updateDealMutateAsync],
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      const dealId = String(id);

      setPending((previous) => {
        const nextDeleted = new Set(previous.deleted);
        nextDeleted.add(dealId);

        return {
          ...previous,
          deleted: nextDeleted,
        };
      });

      try {
        await deleteDealMutateAsync({
          resource: 'deals',
          id,
          meta: {
            gqlMutation: DELETE_DEAL_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticDelete(dealId);
      }
    },
    [deleteDealMutateAsync, removeOptimisticDelete, tableQueryResult],
  );

  useSubscription({
    channel: 'resources/deals',
    types: DEAL_SUBSCRIPTION_TYPES,
    params: {
      resource: 'deals',
      subscriptionType: 'useList' as const,
      filters: [] as CrudFilters,
    },
    meta: {
      gqlQuery: DEALS_LIST_QUERY,
    },
    onLiveEvent: () => {
      logger.debug('[useDeals] live event received, refetching deals');
      if (tableQueryResult?.refetch) {
        void tableQueryResult.refetch();
      }
    },
  });

  return {
    tableProps,
    deals,
    totalCount,
    isLoading,
    isRefetching,
    isError,
    error,
    createDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    refetch,
    pendingCreateIds: Object.keys(pending.created),
    pendingUpdateIds: Object.keys(pending.updated),
    pendingDeleteIds: Array.from(pending.deleted),
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  };
};
