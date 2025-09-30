import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FilterDropdown, useSelect } from '@refinedev/antd';
import { GetFieldsFromList } from '@refinedev/nestjs-query';

import {
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Form, Input, Select, Space, Table, Tooltip } from 'antd';

import { statusOptions } from '@/constants';
import { USERS_SELECT_QUERY } from '@/graphql/queries';
import type { CompanyContactsTableQuery, UsersSelectQuery } from '@/graphql/types';

import { Text } from '@/components/text';
import CustomAvatar from '@/components/custom-avatar';
import { ContactStatusTag } from '@/components/tags/contact-status-tag';
import ContactFormModal from '@/components/company/contact-form-modal';
import SelectOptionWithAvatar from '@/components/select-option-with-avatar';
import { type CompanyContact, type ContactFormValues, useCompanyContacts } from '@/utilities/hooks';

import { logger } from '@/utilities/logger';

type Contact = GetFieldsFromList<CompanyContactsTableQuery>;

type UserOption = GetFieldsFromList<UsersSelectQuery>;

type OwnerLookup = Record<string, UserOption>;

const mapUsersById = (users: UserOption[]): OwnerLookup =>
  users.reduce<OwnerLookup>((accumulator, user) => {
    accumulator[String(user.id)] = user;
    return accumulator;
  }, {});

export const CompanyContactsTable = () => {
  const params = useParams();
  const companyId = params?.id ? String(params.id) : undefined;

  const {
    tableProps,
    contacts,
    totalCount,
    isRefetching,
    createContact,
    updateContact,
    deleteContact,
    pendingUpdateIds,
    pendingDeleteIds,
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  } = useCompanyContacts(companyId);

  const { selectProps: rawOwnerSelectProps, queryResult: usersQueryResult } = useSelect<
    GetFieldsFromList<UsersSelectQuery>
  >({
    resource: 'users',
    optionLabel: 'name',
    pagination: {
      mode: 'off',
    },
    meta: {
      gqlQuery: USERS_SELECT_QUERY,
    },
  });

  const users = usersQueryResult.data?.data ?? [];
  const isOwnerLoading = usersQueryResult.isLoading || usersQueryResult.isFetching;
  const ownerLookup = useMemo(() => mapUsersById(users), [users]);
  const fallbackOwnerId = useMemo(() => (users[0]?.id ? String(users[0].id) : undefined), [users]);
  const missingOwnerNotifiedRef = useRef<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [createForm] = Form.useForm<ContactFormValues>();
  const [editForm] = Form.useForm<ContactFormValues>();

  const ensureValidOwnerId = useCallback(
    (ownerId?: string | null): string | undefined => {
      if (ownerId && ownerLookup[String(ownerId)]) {
        return String(ownerId);
      }

      if (fallbackOwnerId && ownerLookup[fallbackOwnerId]) {
        return fallbackOwnerId;
      }

      return ownerId ? String(ownerId) : undefined;
    },
    [fallbackOwnerId, ownerLookup],
  );

  const ownerOptions = useMemo(() => {
    const base = users.length
      ? users.map((user) => ({
          value: String(user.id),
          label: (
            <SelectOptionWithAvatar
              name={user.name}
              avatarUrl={user.avatarUrl ?? undefined}
              entityType="users"
              entityId={user.id}
            />
          ),
        }))
      : (rawOwnerSelectProps.options ?? []);

    if (
      editingContact?.salesOwner &&
      !base.find((option) => option?.value === String(editingContact.salesOwner?.id))
    ) {
      return [
        ...base,
        {
          value: String(editingContact.salesOwner.id),
          label: (
            <SelectOptionWithAvatar
              name={editingContact.salesOwner.name ?? 'Unknown'}
              avatarUrl={editingContact.salesOwner.avatarUrl ?? undefined}
              entityType="users"
              entityId={editingContact.salesOwner.id}
            />
          ),
        },
      ];
    }

    return base;
  }, [editingContact?.salesOwner, rawOwnerSelectProps.options, users]);

  const { message, modal } = App.useApp();

  useEffect(() => {
    if (!editingContact) {
      editForm.resetFields();
      missingOwnerNotifiedRef.current = null;
      return;
    }

    const existingOwnerId = editingContact.salesOwner?.id
      ? String(editingContact.salesOwner.id)
      : undefined;
    const resolvedOwnerId = ensureValidOwnerId(existingOwnerId);

    if (existingOwnerId && resolvedOwnerId && existingOwnerId !== resolvedOwnerId) {
      const key = `${editingContact.id}-${existingOwnerId}`;
      if (missingOwnerNotifiedRef.current !== key) {
        const fallbackOwner = resolvedOwnerId ? ownerLookup[resolvedOwnerId] : undefined;
        if (fallbackOwner) {
          message.info(`Previous owner is unavailable, reassigned to ${fallbackOwner.name}.`);
        } else {
          message.warning(
            'Previous owner is unavailable. Please select a new owner before saving.',
          );
        }
        missingOwnerNotifiedRef.current = key;
      }
    }

    editForm.setFieldsValue({
      name: editingContact.name ?? '',
      email: editingContact.email ?? '',
      jobTitle: editingContact.jobTitle ?? undefined,
      phone: editingContact.phone ?? undefined,
      status: editingContact.status ?? undefined,
      salesOwnerId: resolvedOwnerId,
    });
  }, [editForm, editingContact, ensureValidOwnerId, message, ownerLookup]);

  const tablePagination =
    tableProps.pagination === false
      ? false
      : {
          ...(tableProps.pagination ?? {}),
          total: totalCount,
          showSizeChanger: false,
        };

  const handleOpenCreateModal = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: 'NEW',
      salesOwnerId: ensureValidOwnerId(fallbackOwnerId) ?? fallbackOwnerId,
    });
    setIsCreateModalOpen(true);
  };

  const getOwnerPayload = (ownerId?: string | null): CompanyContact['salesOwner'] | undefined => {
    const resolvedOwnerId = ensureValidOwnerId(ownerId);

    if (!resolvedOwnerId) {
      return undefined;
    }

    const owner = ownerLookup[resolvedOwnerId];
    if (!owner) {
      return undefined;
    }

    return {
      id: String(owner.id),
      name: owner.name,
      avatarUrl: owner.avatarUrl,
    } as CompanyContact['salesOwner'];
  };

  const handleCreateSubmit = async (values: ContactFormValues) => {
    const ownerId = ensureValidOwnerId(values.salesOwnerId);
    if (!ownerId) {
      message.error('Please select a valid sales owner before saving.');
      return;
    }

    const ownerPayload = getOwnerPayload(ownerId);
    if (!ownerPayload) {
      message.error('Please select a valid sales owner before saving.');
      return;
    }

    try {
      await createContact({
        ...values,
        status: values.status ?? 'NEW',
        salesOwnerId: ownerId,
        salesOwner: ownerPayload,
      });
      message.success('Contact created successfully');
      setIsCreateModalOpen(false);
      createForm.resetFields();
    } catch (error) {
      logger.error('Failed to create contact', error);
      const description = error instanceof Error ? error.message : 'Unable to create contact';
      message.error(description);
    }
  };

  const handleCloseEditModal = () => {
    setEditingContact(null);
    editForm.resetFields();
  };

  const handleEditSubmit = async (values: ContactFormValues) => {
    if (!editingContact) {
      return;
    }

    const ownerId = ensureValidOwnerId(values.salesOwnerId);
    if (!ownerId) {
      message.error('Please select a valid sales owner before saving.');
      return;
    }

    const ownerPayload = getOwnerPayload(ownerId);
    if (!ownerPayload) {
      message.error('Please select a valid sales owner before saving.');
      return;
    }

    try {
      await updateContact(String(editingContact.id), {
        ...values,
        status: values.status ?? null,
        salesOwnerId: ownerId,
        salesOwner: ownerPayload,
      });
      message.success('Contact updated successfully');
      handleCloseEditModal();
    } catch (error) {
      logger.error('Failed to update contact', error);
      const description = error instanceof Error ? error.message : 'Unable to update contact';
      message.error(description);
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    const contactId = String(contact.id);

    modal.confirm({
      title: `Remove ${contact.name}?`,
      content: 'This contact will be removed from the company and dashboard totals.',
      okText: 'Delete',
      okType: 'danger',
      autoFocusButton: 'cancel',
      async onOk() {
        try {
          await deleteContact(contactId);
          message.success('Contact removed');
        } catch (error) {
          logger.error('Failed to delete contact', error);
          const description = error instanceof Error ? error.message : 'Unable to delete contact';
          message.error(description);
          throw error;
        }
      },
    });
  };

  const pendingUpdateSet = useMemo(() => new Set(pendingUpdateIds), [pendingUpdateIds]);
  const pendingDeleteSet = useMemo(() => new Set(pendingDeleteIds), [pendingDeleteIds]);

  return (
    <Card
      headStyle={{
        borderBottom: '1px solid #D9D9D9',
        marginBottom: '1px',
      }}
      bodyStyle={{ padding: 0 }}
      title={
        <Space size="middle">
          <TeamOutlined />
          <Text>Contacts</Text>
        </Space>
      }
      extra={
        <Space size="small">
          <Space size={4}>
            <Text className="tertiary">Total contacts:</Text>
            <Text strong>{totalCount}</Text>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={handleOpenCreateModal}
            disabled={!companyId}
            loading={isCreateLoading}
          >
            Add contact
          </Button>
        </Space>
      }
    >
      <Table<Contact>
        {...tableProps}
        dataSource={contacts}
        rowKey={(record) => String(record.id)}
        pagination={tablePagination}
        loading={Boolean(tableProps.loading) || isRefetching}
      >
        <Table.Column<Contact>
          title="Name"
          dataIndex="name"
          render={(_, record) => (
            <Space>
              <CustomAvatar name={record.name} src={record.avatarUrl ?? undefined} />
              <Text
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                {record.name}
              </Text>
            </Space>
          )}
          filterIcon={<SearchOutlined />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column<Contact>
          title="Title"
          dataIndex="jobTitle"
          filterIcon={<SearchOutlined />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search Title" />
            </FilterDropdown>
          )}
        />
        <Table.Column<Contact>
          title="Stage"
          dataIndex="status"
          render={(_, record) => <ContactStatusTag status={record.status} />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ width: '200px' }}
                mode="multiple"
                placeholder="Select Stage"
                options={statusOptions}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column<Contact>
          title="Contact"
          dataIndex="id"
          width={120}
          render={(_, record) => {
            const hasEmail = Boolean(record.email);
            const hasPhone = Boolean(record.phone);

            return (
              <Space>
                <Tooltip title={hasEmail ? 'Email' : 'Email unavailable'}>
                  <Button
                    size="small"
                    href={hasEmail ? `mailto:${record.email}` : undefined}
                    icon={<MailOutlined />}
                    disabled={!hasEmail}
                  />
                </Tooltip>
                <Tooltip title={hasPhone ? 'Call' : 'Phone unavailable'}>
                  <Button
                    size="small"
                    href={hasPhone ? `tel:${record.phone}` : undefined}
                    icon={<PhoneOutlined />}
                    disabled={!hasPhone}
                  />
                </Tooltip>
              </Space>
            );
          }}
        />
        <Table.Column<Contact>
          title="Actions"
          dataIndex="actions"
          width={148}
          render={(_, record) => {
            const contactId = String(record.id);
            const isOptimistic = Boolean(
              (record as CompanyContact & { __optimistic?: boolean }).__optimistic,
            );
            const isUpdating = pendingUpdateSet.has(contactId);
            const isDeleting = pendingDeleteSet.has(contactId);

            return (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    disabled={isOptimistic || isDeleting}
                    loading={isUpdating && !isOptimistic}
                    onClick={() => {
                      setEditingContact(record as CompanyContact);
                      editForm.setFieldsValue({
                        name: record.name ?? '',
                        email: record.email ?? '',
                        jobTitle: record.jobTitle ?? undefined,
                        phone: record.phone ?? undefined,
                        status: record.status ?? undefined,
                        salesOwnerId: record.salesOwner?.id
                          ? String(record.salesOwner.id)
                          : undefined,
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
                    onClick={() => handleDeleteContact(record)}
                  />
                </Tooltip>
              </Space>
            );
          }}
        />
      </Table>

      <ContactFormModal
        title="Add contact"
        open={isCreateModalOpen}
        form={createForm}
        ownerOptions={ownerOptions}
        ownerLoading={isOwnerLoading}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onSubmit={handleCreateSubmit}
        confirmLoading={isCreateLoading}
      />

      <ContactFormModal
        title={`Edit ${editingContact?.name ?? 'contact'}`}
        open={Boolean(editingContact)}
        form={editForm}
        ownerOptions={ownerOptions}
        ownerLoading={isOwnerLoading}
        onCancel={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        confirmLoading={
          Boolean(editingContact) &&
          (isUpdateLoading || pendingUpdateSet.has(String(editingContact?.id)))
        }
      />
    </Card>
  );
};
