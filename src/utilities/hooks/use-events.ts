import { useCallback, useMemo, useState } from "react";
import {
  CrudFilters,
  HttpError,
  LiveEvent,
  useCreate,
  useDelete,
  useList,
  useSubscription,
  useUpdate,
} from "@refinedev/core";
import { GetFieldsFromList } from "@refinedev/nestjs-query";
import dayjs from "dayjs";

import {
  CREATE_EVENT_MUTATION,
  DELETE_EVENT_MUTATION,
  UPDATE_EVENT_MUTATION,
} from "@/graphql/mutations";
import { DASHBOARD_CALENDAR_UPCOMING_EVENTS_QUERY } from "@/graphql/queries";
import type {
  CreateEventMutation,
  DashboardCalendarUpcomingEventsQuery,
  DeleteEventMutation,
  UpdateEventMutation,
} from "@/graphql/types";
import { logger } from "@/utilities/logger";

type EventRecord = GetFieldsFromList<DashboardCalendarUpcomingEventsQuery>;

export type EventFormValues = {
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  categoryId?: string;
  description?: string;
  participantIds?: string[];
};

type OptimisticEvent = EventRecord & { __optimistic: true };

type PendingEventsState = {
  created: Record<string, OptimisticEvent>;
  updated: Record<string, EventRecord>;
  deleted: Set<string>;
};

const EVENT_SUBSCRIPTION_TYPES: LiveEvent["type"][] = ["created", "updated", "deleted"];

const today = () => dayjs().startOf("day").format("YYYY-MM-DD");

export const useEvents = (options?: { limit?: number }) => {
  const limit = options?.limit ?? 5;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useList<GetFieldsFromList<DashboardCalendarUpcomingEventsQuery>>({
    resource: "events",
    pagination: {
      pageSize: limit,
    },
    sorters: [{ field: "startDate", order: "asc" }],
    filters: [
      {
        field: "startDate",
        operator: "gte" as const,
        value: today(),
      },
    ],
    meta: {
      gqlQuery: DASHBOARD_CALENDAR_UPCOMING_EVENTS_QUERY,
    },
    liveMode: "manual",
  });

  const {
    mutateAsync: createEventMutateAsync,
    isLoading: isCreateLoading,
  } = useCreate<CreateEventMutation, HttpError>();
  const {
    mutateAsync: updateEventMutateAsync,
    isLoading: isUpdateLoading,
  } = useUpdate<UpdateEventMutation, HttpError>();
  const {
    mutateAsync: deleteEventMutateAsync,
    isLoading: isDeleteLoading,
  } = useDelete<DeleteEventMutation, HttpError>();

  const [pending, setPending] = useState<PendingEventsState>(() => ({
    created: {},
    updated: {},
    deleted: new Set<string>(),
  }));

  const events = useMemo<EventRecord[]>(() => {
    const baseEvents = data?.data ?? [];
    const optimisticCreates = Object.values(pending.created);
    const updatedEvents = pending.updated;
    const deletedEvents = pending.deleted;

    const hydratedBase = baseEvents
      .filter((event) => !deletedEvents.has(String(event.id)))
      .map((event) => {
        const updated = updatedEvents[String(event.id)];
        if (!updated) {
          return event;
        }

        return {
          ...event,
          ...updated,
        };
      });

    return [...optimisticCreates, ...hydratedBase].sort((a, b) =>
      dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
    );
  }, [data?.data, pending.created, pending.deleted, pending.updated]);

  const isRefetching = !isLoading && isFetching;
  const normalizedError = (error as HttpError | null) ?? null;

  const removeOptimisticCreate = useCallback((eventId: string) => {
    setPending((previous) => {
      if (!(eventId in previous.created)) {
        return previous;
      }

      const nextCreated = { ...previous.created };
      delete nextCreated[eventId];

      return {
        ...previous,
        created: nextCreated,
      };
    });
  }, []);

  const removeOptimisticUpdate = useCallback((eventId: string) => {
    setPending((previous) => {
      if (!(eventId in previous.updated)) {
        return previous;
      }

      const nextUpdated = { ...previous.updated };
      delete nextUpdated[eventId];

      return {
        ...previous,
        updated: nextUpdated,
      };
    });
  }, []);

  const removeOptimisticDelete = useCallback((eventId: string) => {
    setPending((previous) => {
      if (!previous.deleted.has(eventId)) {
        return previous;
      }

      const nextDeleted = new Set(previous.deleted);
      nextDeleted.delete(eventId);

      return {
        ...previous,
        deleted: nextDeleted,
      };
    });
  }, []);

  const createEvent = useCallback(
    async (values: EventFormValues) => {
      const optimisticId = `optimistic-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

      const optimisticEvent: OptimisticEvent = {
        id: optimisticId,
        title: values.title,
        color: values.color,
        startDate: values.startDate,
        endDate: values.endDate,
        __optimistic: true,
      } as OptimisticEvent;

      setPending((previous) => ({
        ...previous,
        created: {
          ...previous.created,
          [optimisticId]: optimisticEvent,
        },
      }));

      try {
        await createEventMutateAsync({
          resource: "events",
          values: {
            title: values.title,
            color: values.color,
            startDate: values.startDate,
            endDate: values.endDate,
            categoryId: values.categoryId,
            description: values.description ?? values.title,
            participantIds: values.participantIds ?? [],
          },
          meta: {
            gqlMutation: CREATE_EVENT_MUTATION,
          },
        });

        await refetch();
      } finally {
        removeOptimisticCreate(optimisticId);
      }
    },
    [createEventMutateAsync, refetch, removeOptimisticCreate],
  );

  const updateEvent = useCallback(
    async (id: string, values: EventFormValues) => {
      const eventId = String(id);
      const existing = events.find((event) => String(event.id) === eventId);

      if (!existing) {
        return;
      }

      const optimisticEvent: EventRecord = {
        ...existing,
        title: values.title,
        color: values.color,
        startDate: values.startDate,
        endDate: values.endDate,
      } as EventRecord;

      setPending((previous) => ({
        ...previous,
        updated: {
          ...previous.updated,
          [eventId]: optimisticEvent,
        },
      }));

      try {
        await updateEventMutateAsync({
          resource: "events",
          id,
          values: {
            title: values.title,
            color: values.color,
            startDate: values.startDate,
            endDate: values.endDate,
            categoryId: values.categoryId,
            description: values.description,
            participantIds: values.participantIds,
          },
          meta: {
            gqlMutation: UPDATE_EVENT_MUTATION,
          },
        });

        await refetch();
      } finally {
        removeOptimisticUpdate(eventId);
      }
    },
    [events, refetch, removeOptimisticUpdate, updateEventMutateAsync],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const eventId = String(id);

      setPending((previous) => {
        const nextDeleted = new Set(previous.deleted);
        nextDeleted.add(eventId);

        return {
          ...previous,
          deleted: nextDeleted,
        };
      });

      try {
        await deleteEventMutateAsync({
          resource: "events",
          id,
          meta: {
            gqlMutation: DELETE_EVENT_MUTATION,
          },
        });

        await refetch();
      } finally {
        removeOptimisticDelete(eventId);
      }
    },
    [deleteEventMutateAsync, refetch, removeOptimisticDelete],
  );

  useSubscription({
    channel: "resources/events",
    types: EVENT_SUBSCRIPTION_TYPES,
    params: {
      resource: "events",
      subscriptionType: "useList" as const,
      filters: [
        {
          field: "startDate",
          operator: "gte" as const,
          value: today(),
        },
      ] as CrudFilters,
    },
    meta: {
      gqlQuery: DASHBOARD_CALENDAR_UPCOMING_EVENTS_QUERY,
    },
    onLiveEvent: () => {
      logger.debug("[useEvents] live event received, refetching events");
      void refetch();
    },
  });

  return {
    events,
    isLoading,
    isRefetching,
    isError: Boolean(normalizedError),
    error: normalizedError,
    createEvent,
    updateEvent,
    deleteEvent,
    pendingCreateIds: Object.keys(pending.created),
    pendingUpdateIds: Object.keys(pending.updated),
    pendingDeleteIds: Array.from(pending.deleted),
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
    refetch,
  };
};
