import { useCallback, useEffect, useMemo, useState } from "react";
import { useTable } from "@refinedev/antd";
import {
  CrudFilters,
  HttpError,
  LiveEvent,
  useCreate,
  useDelete,
  useSubscription,
  useUpdate,
} from "@refinedev/core";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import {
  CREATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
} from "@/graphql/mutations";
import { COMPANY_CONTACTS_TABLE_QUERY } from "@/graphql/queries";
import type {
  CompanyContactsTableQuery,
  CreateContactMutation,
  DeleteContactMutation,
  UpdateContactMutation,
} from "@/graphql/types";
import { logger } from "@/utilities/logger";

export type CompanyContact = GetFieldsFromList<CompanyContactsTableQuery>;

export type ContactFormValues = {
  name: string;
  email: string;
  jobTitle?: string | null;
  phone?: string | null;
  status?: CompanyContact["status"] | null;
  salesOwnerId: string;
};

export type ContactUpsertPayload = ContactFormValues & {
  salesOwner?: CompanyContact["salesOwner"];
};

type OptimisticContact = CompanyContact & { __optimistic: true };

type PendingState = {
  created: Record<string, OptimisticContact>;
  updated: Record<string, CompanyContact>;
  deleted: Set<string>;
};

const SUBSCRIPTION_TYPES: LiveEvent["type"][] = [
  "created",
  "updated",
  "deleted",
];

export const useCompanyContacts = (companyId?: string) => {
  const {
    tableProps,
    tableQueryResult,
  } = useTable<CompanyContact>({
    resource: "contacts",
    syncWithLocation: false,
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
    filters: {
      initial: [
        {
          field: "jobTitle",
          operator: "contains" as const,
          value: undefined,
        },
        {
          field: "name",
          operator: "contains" as const,
          value: "",
        },
      ],
      permanent: companyId
        ? [
            {
              field: "company.id",
              operator: "eq" as const,
              value: companyId,
            },
          ]
        : [],
    },
    meta: {
      gqlQuery: COMPANY_CONTACTS_TABLE_QUERY,
    },
    liveMode: "manual",
    queryOptions: {
      enabled: Boolean(companyId),
    },
  });

  const {
    mutateAsync: createContactMutateAsync,
    isLoading: isCreateLoading,
  } = useCreate<CreateContactMutation, HttpError>();
  const {
    mutateAsync: updateContactMutateAsync,
    isLoading: isUpdateLoading,
  } = useUpdate<UpdateContactMutation, HttpError>();
  const {
    mutateAsync: deleteContactMutateAsync,
    isLoading: isDeleteLoading,
  } = useDelete<DeleteContactMutation, HttpError>();

  const [pending, setPending] = useState<PendingState>(() => ({
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
  }, [companyId]);

  const baseContacts = (tableProps?.dataSource as CompanyContact[] | undefined) ?? [];

  useEffect(() => {
    if (!Object.keys(pending.created).length) {
      return;
    }

    setPending((previous) => {
      const nextCreated = { ...previous.created };
      let changed = false;

      for (const contact of baseContacts) {
        const contactId = String(contact.id);
        if (nextCreated[contactId]) {
          delete nextCreated[contactId];
          changed = true;
        }
      }

      if (!changed) {
        return previous;
      }

      return {
        ...previous,
        created: nextCreated,
      };
    });
  }, [baseContacts]);

  const contacts = useMemo<CompanyContact[]>(() => {
    const optimisticCreates = Object.values(pending.created);
    const optimisticUpdates = pending.updated;
    const optimisticDeletes = pending.deleted;

    const hydratedBase = baseContacts
      .filter((contact) => {
        const contactId = String(contact.id);
        if (optimisticDeletes.has(contactId)) {
          return false;
        }

        if (pending.created[contactId]) {
          return false;
        }

        return true;
      })
      .map((contact) => {
        const updated = optimisticUpdates[String(contact.id)];
        if (!updated) {
          return contact;
        }

        return {
          ...contact,
          ...updated,
        };
      });

    return [...hydratedBase, ...optimisticCreates];
  }, [baseContacts, pending.created, pending.deleted, pending.updated]);

  const paginationConfig = tableProps?.pagination;
  const baseTotal =
    paginationConfig && typeof paginationConfig === "object" && "total" in paginationConfig
      ? (paginationConfig.total ?? baseContacts.length)
      : baseContacts.length;
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

      const next = {
        ...previous,
        created: { ...previous.created },
      };

      delete next.created[optimisticId];

      return next;
    });
  }, []);

  const removeOptimisticUpdate = useCallback((contactId: string) => {
    setPending((previous) => {
      if (!(contactId in previous.updated)) {
        return previous;
      }

      const nextUpdated = { ...previous.updated };
      delete nextUpdated[contactId];

      return {
        ...previous,
        updated: nextUpdated,
      };
    });
  }, []);

  const removeOptimisticDelete = useCallback((contactId: string) => {
    setPending((previous) => {
      if (!previous.deleted.has(contactId)) {
        return previous;
      }

      const nextDeleted = new Set(previous.deleted);
      nextDeleted.delete(contactId);

      return {
        ...previous,
        deleted: nextDeleted,
      };
    });
  }, []);

  const createContact = useCallback(
    async ({ salesOwner, status, ...values }: ContactUpsertPayload) => {
      if (!companyId) {
        throw new Error("A company id is required to create a contact.");
      }

      const optimisticId = `optimistic-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

      const optimisticContact: OptimisticContact = {
        id: optimisticId,
        name: values.name,
        email: values.email,
        jobTitle: values.jobTitle ?? null,
        phone: values.phone ?? null,
        status: status ?? "NEW",
        avatarUrl: null,
        salesOwner: salesOwner ?? null,
        __optimistic: true,
      };

      setPending((previous) => ({
        ...previous,
        created: {
          ...previous.created,
          [optimisticId]: optimisticContact,
        },
      }));

      try {
        const result = await createContactMutateAsync({
          resource: "contacts",
          values: {
            ...values,
            status: status ?? "NEW",
            companyId,
          },
          meta: {
            gqlMutation: CREATE_CONTACT_MUTATION,
          },
        });

        logger.debug("[useCompanyContacts] createContact result", result);

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } catch (error) {
        removeOptimisticCreate(optimisticId);
        throw error;
      }
    },
    [companyId, createContactMutateAsync, removeOptimisticCreate, tableQueryResult],
  );

  const updateContact = useCallback(
    async (id: string, { salesOwner, status, ...values }: ContactUpsertPayload) => {
      const contactId = String(id);

      const existing = contacts.find((contact) => String(contact.id) === contactId) ?? null;

      const nextStatus = status === null ? null : status ?? existing?.status ?? "NEW";

      const baseContact = (existing ?? {}) as Partial<CompanyContact>;

      const optimisticContact: CompanyContact = {
        ...baseContact,
        id: contactId,
        name: values.name,
        email: values.email,
        jobTitle: values.jobTitle ?? null,
        phone: values.phone ?? null,
        status: nextStatus,
        avatarUrl: existing?.avatarUrl ?? null,
        salesOwner: salesOwner ?? existing?.salesOwner ?? null,
      } as CompanyContact;

      setPending((previous) => ({
        ...previous,
        updated: {
          ...previous.updated,
          [contactId]: optimisticContact,
        },
      }));

      try {
        await updateContactMutateAsync({
          resource: "contacts",
          id,
          values: {
            ...values,
            status: status === null ? null : status ?? undefined,
          },
          meta: {
            gqlMutation: UPDATE_CONTACT_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticUpdate(contactId);
      }
    },
    [contacts, removeOptimisticUpdate, tableQueryResult, updateContactMutateAsync],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      const contactId = String(id);

      setPending((previous) => {
        const nextDeleted = new Set(previous.deleted);
        nextDeleted.add(contactId);

        return {
          ...previous,
          deleted: nextDeleted,
        };
      });

      try {
        await deleteContactMutateAsync({
          resource: "contacts",
          id,
          meta: {
            gqlMutation: DELETE_CONTACT_MUTATION,
          },
        });

        if (tableQueryResult?.refetch) {
          await tableQueryResult.refetch();
        }
      } finally {
        removeOptimisticDelete(contactId);
      }
    },
    [deleteContactMutateAsync, removeOptimisticDelete, tableQueryResult],
  );

  useSubscription({
    channel: "resources/contacts",
    enabled: Boolean(companyId),
    types: SUBSCRIPTION_TYPES,
    params: {
      resource: "contacts",
      subscriptionType: "useList" as const,
      filters: (companyId
        ? [
            {
              field: "company.id",
              operator: "eq" as const,
              value: companyId,
            },
          ]
        : []) as CrudFilters,
    },
    meta: {
      gqlQuery: COMPANY_CONTACTS_TABLE_QUERY,
    },
    onLiveEvent: () => {
      logger.debug("[useCompanyContacts] live event received, refetching contacts");
      if (tableQueryResult?.refetch) {
        void tableQueryResult.refetch();
      }
    },
  });

  useEffect(() => {
    if (!Object.keys(pending.created).length) {
      return;
    }

    setPending((previous) => previous);
  }, [baseContacts, pending.created]);

  return {
    tableProps,
    contacts,
    totalCount,
    isLoading,
    isRefetching,
    isError,
    error,
    createContact,
    updateContact,
    deleteContact,
    refetch,
    pendingCreateIds: Object.keys(pending.created),
    pendingUpdateIds: Object.keys(pending.updated),
    pendingDeleteIds: Array.from(pending.deleted),
    isCreateLoading,
    isUpdateLoading,
    isDeleteLoading,
  };
};
