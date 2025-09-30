import { renderHook, act } from '@testing-library/react';

import { useTaskBoard } from '@/utilities/hooks/use-task-board';
import type { TaskBoardStage, TaskBoardTask } from '@/utilities/hooks/use-task-board';
import { useList, useSubscription, useUpdate } from '@refinedev/core';

jest.mock('@refinedev/core', () => {
  const actual = jest.requireActual<typeof import('@refinedev/core')>('@refinedev/core');

  return {
    ...actual,
    useList: jest.fn(),
    useUpdate: jest.fn(),
    useSubscription: jest.fn(),
  };
});

const mockedUseList = useList as unknown as jest.Mock;
const mockedUseUpdate = useUpdate as unknown as jest.Mock;
const mockedUseSubscription = useSubscription as unknown as jest.Mock;

describe('useTaskBoard', () => {
  const stages: TaskBoardStage[] = [
    { id: 'stage-1', title: 'TODO' } as TaskBoardStage,
    { id: 'stage-2', title: 'IN PROGRESS' } as TaskBoardStage,
  ];
  let tasksState: TaskBoardTask[];
  let latestMutationHandlers: {
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  };
  const createStageResponse = () => ({
    data: { data: stages },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: jest.fn(async () => ({ data: { data: stages } })),
  });
  let refetchTasksMock: jest.Mock;

  beforeEach(() => {
    tasksState = [
      {
        id: 'task-1',
        title: 'Initial Task',
        description: null,
        dueDate: null,
        completed: false,
        stageId: 'stage-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        users: [],
      } as TaskBoardTask,
    ];

    refetchTasksMock = jest.fn(async () => ({ data: { data: tasksState } })) as jest.Mock;
    latestMutationHandlers = {};

    mockedUseList.mockImplementation((params?: { resource?: string }) => {
      if (params?.resource === 'taskStages') {
        return createStageResponse();
      }

      if (params?.resource === 'tasks') {
        return {
          data: { data: tasksState },
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: refetchTasksMock,
        };
      }

      throw new Error('Unexpected resource');
    });

    mockedUseUpdate.mockImplementation(() => ({
      mutate: (
        _variables: unknown,
        options?: {
          onSuccess?: () => void;
          onError?: (error: unknown) => void;
        },
      ) => {
        latestMutationHandlers = {
          onSuccess: options?.onSuccess,
          onError: options?.onError,
        };
      },
    }));

    mockedUseSubscription.mockImplementation(() => undefined);
  });

  it('moves tasks optimistically and clears pending IDs after reconciliation', () => {
    const { result, rerender } = renderHook(() => useTaskBoard());

    expect(result.current.columns[0].tasks).toHaveLength(1);
    expect(result.current.unassignedTasks).toHaveLength(0);

    act(() => {
      result.current.moveTask({ taskId: 'task-1', nextStageId: null });
    });

    expect(result.current.unassignedTasks).toHaveLength(1);
    expect(result.current.pendingTaskIds).toContain('task-1');

    act(() => {
      latestMutationHandlers?.onSuccess?.();
    });

    tasksState = tasksState.map((task) =>
      task.id === 'task-1' ? { ...task, stageId: null } : task,
    );

    act(() => {
      rerender();
    });

    expect(result.current.pendingTaskIds).not.toContain('task-1');
    expect(refetchTasksMock).not.toHaveBeenCalled();
  });
});
