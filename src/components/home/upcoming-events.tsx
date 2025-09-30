import { useEffect, useMemo, useState } from "react";

import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Badge, Button, Card, Form, List, Space, Tooltip } from "antd";
import dayjs from "dayjs";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import EventFormModal from "@/components/events/event-form-modal";
import UpcomingEventsSkeleton from "@/components/skeleton/upcoming-events";
import { EVENT_CATEGORIES_SELECT_QUERY } from "@/graphql/queries";
import type { EventCategoriesSelectQuery } from "@/graphql/types";
import { getDate } from "@/utilities/helpers";
import { useSelect } from "@refinedev/antd";
import { Text } from "../text";
import { useEvents, type EventFormValues } from "@/utilities/hooks";
import { logger } from "@/utilities/logger";

type EventModalFormValues = {
  title: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  color: string;
};

const UpcomingEvents = () => {
  const {
    events,
    isLoading,
    isRefetching,
    createEvent,
    updateEvent,
    deleteEvent,
    pendingUpdateIds,
    pendingDeleteIds,
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  } = useEvents({ limit: 5 });

  const {
    queryResult: categoriesQueryResult,
  } = useSelect<GetFieldsFromList<EventCategoriesSelectQuery>>({
    resource: "eventCategories",
    optionLabel: "title",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: EVENT_CATEGORIES_SELECT_QUERY,
    },
  });

  const categories = categoriesQueryResult.data?.data ?? [];
  const defaultCategoryId = categories[0]?.id ? String(categories[0].id) : undefined;

  const { message, modal } = App.useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<(typeof events)[number] | null>(null);
  const [createForm] = Form.useForm<EventModalFormValues>();
  const [editForm] = Form.useForm<EventModalFormValues>();

  useEffect(() => {
    if (!editingEvent) {
      editForm.resetFields();
      return;
    }

    editForm.setFieldsValue({
      title: editingEvent.title,
      color: editingEvent.color,
      dateRange: [dayjs(editingEvent.startDate), dayjs(editingEvent.endDate)],
    });
  }, [editForm, editingEvent]);

  const handleOpenCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      dateRange: [dayjs().add(1, "hour"), dayjs().add(2, "hour")],
      color: "#1677ff",
    });
    setIsCreateModalOpen(true);
  };

  const pendingUpdateSet = useMemo(() => new Set(pendingUpdateIds), [pendingUpdateIds]);
  const pendingDeleteSet = useMemo(() => new Set(pendingDeleteIds), [pendingDeleteIds]);

  const handleCreate = async (values: EventFormValues) => {
    if (!defaultCategoryId) {
      message.error("No event categories are available for scheduling.");
      return;
    }

    try {
      await createEvent({
        ...values,
        categoryId: defaultCategoryId,
        description: values.title,
        participantIds: [],
      });
      message.success("Event created");
      setIsCreateModalOpen(false);
      createForm.resetFields();
    } catch (error) {
      logger.error("Failed to create event", error);
      const description = error instanceof Error ? error.message : "Unable to create event";
      message.error(description);
    }
  };

  const handleCloseEditModal = () => {
    setEditingEvent(null);
    editForm.resetFields();
  };

  const handleUpdate = async (values: EventFormValues) => {
    if (!editingEvent) {
      return;
    }

    try {
      await updateEvent(String(editingEvent.id), {
        ...values,
        description: values.title,
      });
      message.success("Event updated");
      handleCloseEditModal();
    } catch (error) {
      logger.error("Failed to update event", error);
      const description = error instanceof Error ? error.message : "Unable to update event";
      message.error(description);
    }
  };

  const handleDelete = (event: (typeof events)[number]) => {
    const eventId = String(event.id);

    modal.confirm({
      title: `Delete ${event.title}?`,
      content: "This event will be removed from the dashboard calendar.",
      okText: "Delete",
      okType: "danger",
      autoFocusButton: "cancel",
      async onOk() {
        try {
          await deleteEvent(eventId);
          message.success("Event deleted");
        } catch (error) {
          logger.error("Failed to delete event", error);
          const description = error instanceof Error ? error.message : "Unable to delete event";
          message.error(description);
          throw error;
        }
      },
    });
  };

  const isBusy = isLoading || isRefetching;
  const isEmpty = !isBusy && events.length === 0;

  return (
    <Card
      style={{ height: "100%" }}
      headStyle={{ padding: "8px 16px" }}
      bodyStyle={{ padding: "0 1rem" }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarOutlined />
          <Text size="sm" style={{ marginLeft: "0.7rem" }}>
            Upcoming Events
          </Text>
        </div>
      }
      extra={
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
          disabled={!defaultCategoryId}
        >
          Add event
        </Button>
      }
    >
      {isBusy ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: 5 }).map((_, index) => ({ id: index }))}
          renderItem={() => <UpcomingEventsSkeleton />}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={events}
          renderItem={(item) => {
            const renderDate = getDate(item.startDate, item.endDate);
            const eventId = String(item.id);
            const isOptimistic = Boolean((item as (typeof events)[number] & { __optimistic?: boolean }).__optimistic);

            return (
              <List.Item
                actions={[
                  <Tooltip title="Edit" key="edit">
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      disabled={isOptimistic}
                      loading={pendingUpdateSet.has(eventId) || isUpdateLoading}
                      onClick={() => {
                        setEditingEvent(item);
                        editForm.setFieldsValue({
                          title: item.title,
                          color: item.color,
                          dateRange: [dayjs(item.startDate), dayjs(item.endDate)],
                        });
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete" key="delete">
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={isOptimistic}
                      loading={pendingDeleteSet.has(eventId) || isDeleteLoading}
                      onClick={() => handleDelete(item)}
                    />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Badge color={item.color} />}
                  title={<Text size="xs">{renderDate}</Text>}
                  description={
                    <Text ellipsis={{ tooltip: true }} strong>
                      {item.title}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {!isBusy && isEmpty && (
        <span
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "220px",
          }}
        >
          No upcoming events
        </span>
      )}

      <EventFormModal
        title="Add event"
        open={isCreateModalOpen}
        form={createForm}
        confirmLoading={isCreateLoading}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onSubmit={handleCreate}
      />

      <EventFormModal
        title={`Edit ${editingEvent?.title ?? "event"}`}
        open={Boolean(editingEvent)}
        form={editForm}
        confirmLoading={Boolean(editingEvent) && isUpdateLoading}
        onCancel={handleCloseEditModal}
        onSubmit={handleUpdate}
      />
    </Card>
  );
};

export default UpcomingEvents;
