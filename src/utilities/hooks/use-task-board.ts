import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HttpError,
  LiveEvent,
  useList,
  useSubscription,
  useUpdate,
} from "@refinedev/core";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import { UPDATE_TASK_STAGE_MUTATION } from "@/graphql/mutations";
import { TASK_STAGES_QUERY, TASKS_QUERY } from "@/graphql/queries";
import type { TaskStagesQuery, TasksQuery } from "@/graphql/types";

export type TaskBoardTask = GetFieldsFromList<TasksQuery>;
export type TaskBoardStage = GetFieldsFromList<TaskStagesQuery>;

export type TaskBoardColumn = {
  id: string;
  title: string;
  tasks: TaskBoardTask[];
};

export type MoveTaskVariables = {
  taskId: string;
  nextStageId: string | null;
};

export type UseTaskBoardResult = {
  columns: TaskBoardColumn[];
  unassignedTasks: TaskBoardTask[];
  isLoading: boolean;
  isRefetching: boolean;
  isEmpty: boolean;
  isError: boolean;
  error: HttpError | Error | null;
  pendingTaskIds: string[];
  moveTask: (variables: MoveTaskVariables) => void;
  refetch: () => Promise<unknown>;
};

const TASKS_SUBSCRIPTION_TYPES: LiveEvent["type"][] = [
  "created",
  "updated",
  "deleted",
];

const TASK_STAGES = ["TODO", "IN PROGRESS", "IN REVIEW", "DONE"];

export const useTaskBoard = (): UseTaskBoardResult => {
  const [optimisticError, setOptimisticError] = useState<HttpError | Error | null>(
    null,
  );
  const [pendingMoves, setPendingMoves] = useState<Record<string, string | null>>(
    {},
  );

  const stagesQueryResult = useList<TaskBoardStage>({
    resource: "taskStages",
    filters: [
      {
        field: "title",
        operator: "in",
        value: TASK_STAGES,
      },
    ],
    sorters: [{ field: "createdAt", order: "asc" }],
    meta: {
      gqlQuery: TASK_STAGES_QUERY,
    },
    liveMode: "manual",
  });

  const tasksQueryResult = useList<TaskBoardTask>({
    resource: "tasks",
    sorters: [{ field: "dueDate", order: "asc" }],
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: TASKS_QUERY,
    },
    liveMode: "manual",
  });

  const { mutate } = useUpdate<TaskBoardTask>({
    resource: "tasks",
    meta: {
      gqlMutation: UPDATE_TASK_STAGE_MUTATION,
    },
  });

  const {
    data: stagesData,
    isLoading: isStagesLoading,
    isFetching: isStagesFetching,
    error: stagesError,
    refetch: refetchStages,
  } = stagesQueryResult;

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
    error: tasksError,
    refetch: refetchTasks,
  } = tasksQueryResult;

  const stages = stagesData?.data ?? [];
  const tasks = tasksData?.data ?? [];

  useEffect(() => {
    if (!tasks.length) {
      return;
    }

    setPendingMoves((previous) => {
      if (!Object.keys(previous).length) {
        return previous;
      }

      let hasChanges = false;
      const next = { ...previous };

      for (const task of tasks) {
        if (!(task.id in previous)) {
          continue;
        }

        const pendingStageId = previous[task.id];
        const actualStageId = task.stageId ?? null;

        if (pendingStageId === actualStageId) {
          delete next[task.id];
          hasChanges = true;
        }
      }

      return hasChanges ? next : previous;
    });
  }, [tasks]);

  const tasksWithPendingMoves = useMemo(() => {
    if (!tasks.length) {
      return tasks;
    }

    if (!Object.keys(pendingMoves).length) {
      return tasks;
    }

    return tasks.map((task) => {
      if (!(task.id in pendingMoves)) {
        return task;
      }

      return {
        ...task,
        stageId: pendingMoves[task.id],
      };
    });
  }, [pendingMoves, tasks]);

  const columns = useMemo<TaskBoardColumn[]>(() => {
    if (!stages.length) {
      return [];
    }

    return stages.map((stage) => ({
      id: stage.id,
      title: stage.title,
      tasks: tasksWithPendingMoves.filter(
        (task) => task.stageId?.toString() === stage.id.toString(),
      ),
    }));
  }, [stages, tasksWithPendingMoves]);

  const unassignedTasks = useMemo(() => {
    if (!tasksWithPendingMoves.length) {
      return [] as TaskBoardTask[];
    }

    return tasksWithPendingMoves.filter((task) => task.stageId === null);
  }, [tasksWithPendingMoves]);

  const isLoading = isStagesLoading || isTasksLoading;
  const isFetching = isStagesFetching || isTasksFetching;
  const isRefetching = !isLoading && isFetching;

  const listError =
    (stagesError as HttpError | null) || (tasksError as HttpError | null);

  const error = optimisticError ?? listError;
  const isError = Boolean(error);
  const isEmpty = !isLoading && !isError && !tasksWithPendingMoves.length;

  const refetch = useCallback(async () => {
    return Promise.all([refetchStages(), refetchTasks()]);
  }, [refetchStages, refetchTasks]);

  const moveTask = useCallback(
    ({ taskId, nextStageId }: MoveTaskVariables) => {
      if (!taskId) {
        return;
      }

      setOptimisticError(null);
      setPendingMoves((previous) => ({
        ...previous,
        [taskId]: nextStageId,
      }));

      mutate(
        {
          id: taskId,
          values: {
            stageId: nextStageId,
          },
          mutationMode: "pessimistic",
          successNotification: false,
        },
        {
          onSuccess: () => {
            setPendingMoves((previous) => {
              if (!(taskId in previous)) {
                return previous;
              }

              const next = { ...previous };
              delete next[taskId];
              return next;
            });
          },
          onError: (mutationError) => {
            setOptimisticError(mutationError ?? new Error("Failed to update task"));

            setPendingMoves((previous) => {
              if (!(taskId in previous)) {
                return previous;
              }

              const next = { ...previous };
              delete next[taskId];
              return next;
            });

            void refetch();
          },
        },
      );
    },
    [mutate, refetch],
  );

  const taskSubscriptionParams = {
    resource: "tasks",
    subscriptionType: "useList",
    filters: [],
  };

  console.debug("[useTaskBoard] subscribing to tasks", taskSubscriptionParams);

  useSubscription({
    channel: "resources/tasks",
    types: TASKS_SUBSCRIPTION_TYPES,
    params: taskSubscriptionParams,
    meta: {
      gqlQuery: TASKS_QUERY,
    },
    onLiveEvent: () => {
      void refetchTasks();
    },
  });

  const taskStagesSubscriptionParams = {
    resource: "taskStages",
    subscriptionType: "useList",
    filters: [],
  };

  console.debug(
    "[useTaskBoard] subscribing to taskStages",
    taskStagesSubscriptionParams,
  );

  useSubscription({
    channel: "resources/taskStages",
    types: TASKS_SUBSCRIPTION_TYPES,
    params: taskStagesSubscriptionParams,
    meta: {
      gqlQuery: TASK_STAGES_QUERY,
    },
    onLiveEvent: () => {
      void refetchStages();
    },
  });

  return {
    columns,
    unassignedTasks,
    isLoading,
    isRefetching,
    isEmpty,
    isError,
    error,
    pendingTaskIds: Object.keys(pendingMoves),
    moveTask,
    refetch,
  };
};
