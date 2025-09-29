import { KanbanColumnSkeleton, ProjectCardSkeleton } from "@/components";
import { KanbanAddCardButton } from "@/components/tasks/kanban/add-card-button";
import {
  KanbanBoardContainer,
  KanbanBoard,
} from "@/components/tasks/kanban/board";
import { ProjectCardMemo } from "@/components/tasks/kanban/card";
import KanbanColumn from "@/components/tasks/kanban/column";
import KanbanItem from "@/components/tasks/kanban/item";
import { DragEndEvent } from "@dnd-kit/core";
import { useNavigation } from "@refinedev/core";
import { Alert, Button, Empty } from "antd";
import React from "react";

import { useTaskBoard } from "@/utilities/hooks";

const List = ({ children }: React.PropsWithChildren) => {
  const { replace } = useNavigation();
  const {
    columns,
    unassignedTasks,
    isLoading,
    isError,
    error,
    isEmpty,
    moveTask,
    refetch,
  } = useTaskBoard();
  const handleAddCard = (args: { stageId: string }) => {
    const path =
      args.stageId === "unassigned"
        ? "/tasks/new"
        : `/tasks/new?stageId=${args.stageId}`;

    replace(path);
  };
  const handleOnDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id as string | undefined;
    const taskId = event.active.id as string;
    const originStage = event.active.data.current?.stageId as
      | string
      | null
      | undefined;

    if (!overId) {
      return;
    }

    const normalizeStageId = (value?: string | null) => {
      if (!value) {
        return null;
      }

      return value === "unassigned" ? null : value;
    };

    const nextStageId = normalizeStageId(overId);
    const previousStageId = normalizeStageId(originStage);

    if (nextStageId === previousStageId) {
      return;
    }

    moveTask({
      taskId,
      nextStageId,
    });
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError) {
    return (
      <KanbanBoardContainer>
        <Alert
          type="error"
          showIcon
          message="Unable to load tasks"
          description={error?.message || "Please try again."}
          action={
            <Button
              onClick={() => {
                void refetch();
              }}
              size="small"
            >
              Retry
            </Button>
          }
        />
      </KanbanBoardContainer>
    );
  }

  if (!columns.length && isEmpty) {
    return (
      <KanbanBoardContainer>
        <Empty description="Create your first task to get started." />
        <KanbanAddCardButton onClick={() => handleAddCard({ stageId: "unassigned" })} />
      </KanbanBoardContainer>
    );
  }
  return (
    <>
      <KanbanBoardContainer>
        <KanbanBoard onDragEnd={handleOnDragEnd}>
          <KanbanColumn
            id="unassigned"
            title={"unassigned"}
            count={unassignedTasks.length}
            onAddClick={() => handleAddCard({ stageId: "unassigned" })}
          >
            {unassignedTasks.map((task) => (
              <KanbanItem
                key={task.id}
                id={task.id}
                data={{ ...task, stageId: "unassigned" }}
              >
                <ProjectCardMemo
                  {...task}
                  dueDate={task.dueDate || undefined}
                />
              </KanbanItem>
            ))}
            {!unassignedTasks.length && (
              <KanbanAddCardButton
                onClick={() => handleAddCard({ stageId: "unassigned" })}
              />
            )}
          </KanbanColumn>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={column.tasks.length}
              onAddClick={() => handleAddCard({ stageId: column.id })}
            >
              {column.tasks.map((task) => (
                <KanbanItem key={task.id} id={task.id} data={task}>
                  <ProjectCardMemo
                    {...task}
                    dueDate={task.dueDate || undefined}
                  />
                </KanbanItem>
              ))}
              {!column.tasks.length && (
                <KanbanAddCardButton
                  onClick={() => handleAddCard({ stageId: column.id })}
                />
              )}
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </KanbanBoardContainer>
      {children}
    </>
  );
};

export default List;

const PageSkeleton = () => {
  const columnCount = 6;
  const itemCount = 4;

  return (
    <KanbanBoardContainer>
      {Array.from({ length: columnCount }).map((_, index) => (
        <KanbanColumnSkeleton key={index}>
          {Array.from({ length: itemCount }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </KanbanColumnSkeleton>
      ))}
    </KanbanBoardContainer>
  );
};
