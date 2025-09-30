import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FilterDropdown, useSelect } from "@refinedev/antd";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { SelectProps, TableProps } from "antd";
import dayjs from "dayjs";

import { COMPANIES_SELECT_QUERY, DEAL_STAGES_SELECT_QUERY, USERS_SELECT_QUERY } from "@/graphql/queries";
import type {
  CompaniesSelectQuery,
  DealStagesSelectQuery,
  DealsListQuery,
  UsersSelectQuery,
} from "@/graphql/types";

import { Text } from "@/components/text";
import CustomAvatar from "@/components/custom-avatar";
import DealFormModal from "@/components/deals/deal-form-modal";
import SelectOptionWithAvatar from "@/components/select-option-with-avatar";
import { currencyNumber } from "@/utilities";
import {
  type DealFormValues,
  type DealUpsertPayload,
  useDeals,
} from "@/utilities/hooks";
import { logger } from "@/utilities/logger";

const formatCurrency = (value?: number | null) => currencyNumber(value ?? 0);

type Deal = GetFieldsFromList<DealsListQuery>;
const mapById = <T extends { id: string | number }>(collection: T[]) => {
  return collection.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[String(item.id)] = item;
    return accumulator;
  }, {});
};

export const DealsList = () => {
  const {
    tableProps,
    deals,
    totalCount,
    isRefetching,
    createDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    pendingUpdateIds,
    pendingDeleteIds,
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  } = useDeals();

  const {
    selectProps: companySelectProps,
    queryResult: companiesQueryResult,
  } = useSelect<GetFieldsFromList<CompaniesSelectQuery>>({
    resource: "companies",
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: COMPANIES_SELECT_QUERY,
    },
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains" as const,
        value,
      },
    ],
  });

  const {
    selectProps: ownerSelectProps,
    queryResult: ownersQueryResult,
  } = useSelect<GetFieldsFromList<UsersSelectQuery>>({
    resource: "users",
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: USERS_SELECT_QUERY,
    },
    onSearch: (value) => [
      {
        field: "name",
        operator: "contains" as const,
        value,
      },
    ],
  });

  const {
    selectProps: stageSelectProps,
    queryResult: stagesQueryResult,
  } = useSelect<GetFieldsFromList<DealStagesSelectQuery>>({
    resource: "dealStages",
    optionLabel: "title",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: DEAL_STAGES_SELECT_QUERY,
    },
  });

  const companies = companiesQueryResult.data?.data ?? [];
  const owners = ownersQueryResult.data?.data ?? [];
  const stages = stagesQueryResult.data?.data ?? [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [createForm] = Form.useForm<DealFormValues>();
  const [editForm] = Form.useForm<DealFormValues>();

  const companiesById = useMemo(() => mapById(companies), [companies]);
  const ownersById = useMemo(() => mapById(owners), [owners]);
  const stagesById = useMemo(() => mapById(stages), [stages]);

  const companyOptions = useMemo<SelectProps["options"]>(() => {
    const fallback: SelectProps["options"] = companies.map((company) => ({
      value: String(company.id),
      label: (
        <SelectOptionWithAvatar
          name={company.name}
          avatarUrl={company.avatarUrl ?? undefined}
          entityType="companies"
          entityId={company.id}
        />
      ),
    }));

    const base: SelectProps["options"] =
      companySelectProps.options && companySelectProps.options.length > 0
        ? companySelectProps.options
        : fallback;

    if (
      editingDeal?.company &&
      !base.find((option) => option?.value === String(editingDeal.company.id))
    ) {
      return [
        ...base,
        {
          value: String(editingDeal.company.id),
          label: (
            <SelectOptionWithAvatar
              name={editingDeal.company.name}
              avatarUrl={editingDeal.company.avatarUrl ?? undefined}
              entityType="companies"
              entityId={editingDeal.company.id}
            />
          ),
        },
      ];
    }

    return base;
  }, [companies, companySelectProps.options, editingDeal?.company]);

  const ownerOptions = useMemo<SelectProps["options"]>(() => {
    const fallback: SelectProps["options"] = owners.map((owner) => ({
      value: String(owner.id),
      label: (
        <SelectOptionWithAvatar
          name={owner.name}
          avatarUrl={owner.avatarUrl ?? undefined}
          entityType="users"
          entityId={owner.id}
        />
      ),
    }));

    const base: SelectProps["options"] =
      ownerSelectProps.options && ownerSelectProps.options.length > 0
        ? ownerSelectProps.options
        : fallback;

    if (
      editingDeal?.dealOwner &&
      !base.find((option) => option?.value === String(editingDeal.dealOwner.id))
    ) {
      return [
        ...base,
        {
          value: String(editingDeal.dealOwner.id),
          label: (
            <SelectOptionWithAvatar
              name={editingDeal.dealOwner.name}
              avatarUrl={editingDeal.dealOwner.avatarUrl ?? undefined}
              entityType="users"
              entityId={editingDeal.dealOwner.id}
            />
          ),
        },
      ];
    }

    return base;
  }, [editingDeal?.dealOwner, ownerSelectProps.options, owners]);

  const stageOptions = useMemo<SelectProps["options"]>(() => {
    const base =
      stageSelectProps.options && stageSelectProps.options.length > 0
        ? [...stageSelectProps.options]
        : stages.map((stage) => ({ value: String(stage.id), label: stage.title }));

    if (editingDeal?.stage && !base.find((option) => option?.value === String(editingDeal.stage?.id))) {
      return [
        ...base,
        { value: String(editingDeal.stage.id), label: editingDeal.stage.title ?? "" },
      ];
    }

    return base;
  }, [editingDeal?.stage, stageSelectProps.options, stages]);
  const fallbackOwnerId = useMemo(() => (owners[0]?.id ? String(owners[0].id) : undefined), [owners]);
  const missingOwnerNotifiedRef = useRef<string | null>(null);

  const ensureValidOwnerId = useCallback(
    (ownerId: string): string => {
      if (ownerId && ownersById[ownerId]) {
        return ownerId;
      }

      if (fallbackOwnerId && ownersById[fallbackOwnerId]) {
        return fallbackOwnerId;
      }

      return ownerId;
    },
    [fallbackOwnerId, ownersById],
  );

  const { message, modal } = App.useApp();

  useEffect(() => {
    if (!editingDeal) {
      editForm.resetFields();
      return;
    }

    const existingOwnerId = editingDeal.dealOwner?.id ? String(editingDeal.dealOwner.id) : undefined;
    const ownerExists = existingOwnerId ? ownersById[existingOwnerId] : null;
    const resolvedOwnerId = existingOwnerId
      ? ensureValidOwnerId(existingOwnerId)
      : fallbackOwnerId && ownersById[fallbackOwnerId]
        ? fallbackOwnerId
        : existingOwnerId;

    if (!ownerExists && existingOwnerId && resolvedOwnerId !== existingOwnerId && fallbackOwnerId) {
      const key = `${editingDeal.id}-${existingOwnerId}`;
      if (missingOwnerNotifiedRef.current !== key) {
        const fallbackOwner = fallbackOwnerId ? ownersById[fallbackOwnerId] : undefined;
        message.info(
          fallbackOwner
            ? `Previous owner is unavailable, reassigned to ${fallbackOwner.name}.`
            : "Previous owner is unavailable and will need reassignment before saving.",
        );
        missingOwnerNotifiedRef.current = key;
      }
    }

    editForm.setFieldsValue({
      title: editingDeal.title,
      value: editingDeal.value ?? 0,
      companyId: String(editingDeal.company.id),
      dealOwnerId: resolvedOwnerId ?? undefined,
      stageId: editingDeal.stage?.id ? String(editingDeal.stage.id) : undefined,
    });
  }, [editForm, editingDeal, ensureValidOwnerId, fallbackOwnerId, message, ownersById]);

  useEffect(() => {
    if (!editingDeal) {
      missingOwnerNotifiedRef.current = null;
    }
  }, [editingDeal]);

  const tablePagination =
    tableProps.pagination === false
      ? false
      : {
          ...(tableProps.pagination ?? {}),
          total: totalCount,
          showSizeChanger: false,
        };

  const tableOnChange = tableProps.onChange;
  type TableOnChangeArgs = Parameters<NonNullable<TableProps<Deal>["onChange"]>>;

  const handleTableChange: TableProps<Deal>["onChange"] = useCallback(
    (
      pagination: TableOnChangeArgs[0],
      filters: TableOnChangeArgs[1],
      sorter: TableOnChangeArgs[2],
      extra: TableOnChangeArgs[3],
    ) => {
      if (!tableOnChange) {
        return;
      }

      if (filters && Object.prototype.hasOwnProperty.call(filters, "company")) {
        const { company: _removed, ...rest } = filters as Record<string, unknown>;
        tableOnChange(
          pagination,
          rest as Parameters<NonNullable<typeof tableOnChange>>[1],
          sorter,
          extra,
        );
        return;
      }

      tableOnChange(pagination, filters, sorter, extra);
    },
    [tableOnChange],
  );

  const pendingUpdateSet = useMemo(() => new Set(pendingUpdateIds), [pendingUpdateIds]);
  const pendingDeleteSet = useMemo(() => new Set(pendingDeleteIds), [pendingDeleteIds]);

  const handleOpenCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ value: 0 });
    setIsCreateModalOpen(true);
  };

  const buildPayload = (values: DealFormValues): DealUpsertPayload => {
    const normalizedOwnerId = ensureValidOwnerId(String(values.dealOwnerId));
    return {
      ...values,
      value: typeof values.value === "number" ? values.value : 0,
      company: companiesById[String(values.companyId)],
      dealOwner: ownersById[normalizedOwnerId] ?? ownersById[String(values.dealOwnerId)],
      stage: values.stageId ? stagesById[String(values.stageId)] : undefined,
      dealOwnerId: normalizedOwnerId,
    };
  };

  const handleCreateSubmit = async (values: DealFormValues) => {
    try {
      await createDeal(buildPayload(values));
      message.success("Deal created successfully");
      setIsCreateModalOpen(false);
      createForm.resetFields();
    } catch (error) {
      logger.error("Failed to create deal", error);
      const description = error instanceof Error ? error.message : "Unable to create deal";
      message.error(description);
    }
  };

  const handleCloseEditModal = () => {
    setEditingDeal(null);
    editForm.resetFields();
  };

  const handleEditSubmit = async (values: DealFormValues) => {
    if (!editingDeal) {
      return;
    }

    try {
      await updateDeal(String(editingDeal.id), buildPayload(values));
      message.success("Deal updated successfully");
      handleCloseEditModal();
    } catch (error) {
      logger.error("Failed to update deal", error);
      const description = error instanceof Error ? error.message : "Unable to update deal";
      message.error(description);
    }
  };

  const handleDeleteDeal = (deal: Deal) => {
    const dealId = String(deal.id);
    modal.confirm({
      title: `Delete ${deal.title}?`,
      content: "This deal will be removed from the pipeline and dashboard metrics.",
      okText: "Delete",
      okType: "danger",
      autoFocusButton: "cancel",
      async onOk() {
        try {
          await deleteDeal(dealId);
          message.success("Deal deleted");
        } catch (error) {
          logger.error("Failed to delete deal", error);
          const description = error instanceof Error ? error.message : "Unable to delete deal";
          message.error(description);
          throw error;
        }
      },
    });
  };

  const handleStageChange = async (deal: Deal, nextStageId: string) => {
    if (String(deal.stage?.id ?? "") === nextStageId) {
      return;
    }

    try {
      await updateDealStage(String(deal.id), nextStageId, stagesById[nextStageId]);
      message.success(`Deal moved to ${stagesById[nextStageId]?.title ?? "new stage"}`);
    } catch (error) {
      logger.error("Failed to update deal stage", error);
      const description = error instanceof Error ? error.message : "Unable to update stage";
      message.error(description);
    }
  };

  return (
    <Card
      title={
        <Space size="middle">
          <DollarOutlined />
          <Text>Deals</Text>
        </Space>
      }
      extra={
        <Space size={4}>
          <Text className="tertiary">Total deals:</Text>
          <Text strong>{totalCount}</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={handleOpenCreateModal}
            loading={isCreateLoading}
          >
            Add deal
          </Button>
        </Space>
      }
      bodyStyle={{ padding: 0 }}
    >
      <Table<Deal>
        {...tableProps}
        dataSource={deals}
        rowKey={(record) => String(record.id)}
        pagination={tablePagination}
        loading={Boolean(tableProps.loading) || isRefetching}
        onChange={handleTableChange}
      >
        <Table.Column<Deal>
          title="Deal"
          dataIndex="title"
          filterIcon={<SearchOutlined />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search Title" />
            </FilterDropdown>
          )}
          render={(_, record) => (
            <Space direction="vertical" size={0}>
              <Text strong>{record.title}</Text>
              <Text size="xs" className="tertiary">
                {dayjs(record.createdAt).format("MMM D, YYYY")}
              </Text>
            </Space>
          )}
        />
        <Table.Column<Deal>
          title="Company"
          dataIndex="company.name"
          filterIcon={<SearchOutlined />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search Company" />
            </FilterDropdown>
          )}
          render={(_, record) => (
            <Space>
              <CustomAvatar
                shape="square"
                name={record.company.name}
                src={record.company.avatarUrl ?? undefined}
                entityType="companies"
                entityId={record.company.id}
              />
              <Text>{record.company.name}</Text>
            </Space>
          )}
        />
        <Table.Column<Deal>
          title="Owner"
          dataIndex="dealOwner.name"
          render={(_, record) => (
            <Space>
              <CustomAvatar
                name={record.dealOwner.name}
                src={record.dealOwner.avatarUrl ?? undefined}
                entityType="users"
                entityId={record.dealOwner.id}
              />
              <Text>{record.dealOwner.name}</Text>
            </Space>
          )}
        />
        <Table.Column<Deal>
          title="Stage"
          dataIndex="stage"
          render={(_, record) => {
            const dealId = String(record.id);
            const isOptimistic = Boolean((record as Deal & { __optimistic?: boolean }).__optimistic);
            const isUpdating = pendingUpdateSet.has(dealId);

            return (
              <Select
                size="small"
                disabled={isOptimistic}
                loading={isUpdating}
                value={record.stage?.id ? String(record.stage.id) : undefined}
                placeholder="Select stage"
                onChange={(value) => handleStageChange(record, value)}
                options={stageOptions}
                style={{ minWidth: 140 }}
              />
            );
          }}
        />
        <Table.Column<Deal>
          title="Value"
          dataIndex="value"
          align="right"
          render={(value: Deal["value"]) => (
            <Tag color="green">{formatCurrency(value)}</Tag>
          )}
        />
        <Table.Column<Deal>
          title="Actions"
          dataIndex="actions"
          width={148}
          render={(_, record) => {
            const dealId = String(record.id);
            const isOptimistic = Boolean((record as Deal & { __optimistic?: boolean }).__optimistic);
            const isDeleting = pendingDeleteSet.has(dealId);

            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    disabled={isOptimistic || isDeleting}
                    loading={pendingUpdateSet.has(dealId)}
                    onClick={() => {
                      setEditingDeal(record);
                      editForm.setFieldsValue({
                        title: record.title,
                        value: record.value ?? 0,
                        companyId: String(record.company.id),
                        dealOwnerId: String(record.dealOwner.id),
                        stageId: record.stage?.id ? String(record.stage.id) : undefined,
                      });
                    }}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={isOptimistic}
                    loading={isDeleting || isDeleteLoading}
                    onClick={() => handleDeleteDeal(record)}
                  />
                </Tooltip>
              </Space>
            );
          }}
        />
      </Table>

      <DealFormModal
        title="Add deal"
        open={isCreateModalOpen}
        form={createForm}
        companyOptions={companyOptions}
        ownerOptions={ownerOptions}
        stageOptions={stageOptions}
        companyLoading={companiesQueryResult.isLoading || companiesQueryResult.isFetching}
        ownerLoading={ownersQueryResult.isLoading || ownersQueryResult.isFetching}
        stageLoading={stagesQueryResult.isLoading || stagesQueryResult.isFetching}
        confirmLoading={isCreateLoading}
        companyOnSearch={companySelectProps.onSearch}
        ownerOnSearch={ownerSelectProps.onSearch}
        stageOnSearch={stageSelectProps.onSearch}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onSubmit={handleCreateSubmit}
      />

      <DealFormModal
        title={`Edit ${editingDeal?.title ?? "deal"}`}
        open={Boolean(editingDeal)}
        form={editForm}
        companyOptions={companyOptions}
        ownerOptions={ownerOptions}
        stageOptions={stageOptions}
        companyLoading={companiesQueryResult.isLoading || companiesQueryResult.isFetching}
        ownerLoading={ownersQueryResult.isLoading || ownersQueryResult.isFetching}
        stageLoading={stagesQueryResult.isLoading || stagesQueryResult.isFetching}
        confirmLoading={Boolean(editingDeal) && isUpdateLoading}
        companyOnSearch={companySelectProps.onSearch}
        ownerOnSearch={ownerSelectProps.onSearch}
        stageOnSearch={stageSelectProps.onSearch}
        onCancel={handleCloseEditModal}
        onSubmit={handleEditSubmit}
      />
    </Card>
  );
};

export default DealsList;
