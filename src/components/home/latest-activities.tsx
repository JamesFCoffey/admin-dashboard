import { UnorderedListOutlined } from "@ant-design/icons";
import { Card, List, Space } from "antd";
import React, { useEffect, useMemo } from "react";
import { Text } from "../text";
import LatestActivitiesSkeleton from "../skeleton/latest-activities";
import { LiveEvent, useList, useSubscription } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { GetFieldsFromList } from "@refinedev/nestjs-query";
import {
  COMPANIES_SELECT_QUERY,
  DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
  DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
  DEAL_STAGES_SELECT_QUERY,
} from "@/graphql/queries";
import type {
  DashboardLatestActivitiesAuditsQuery,
  DashboardLatestActivitiesDealsQuery,
  CompaniesSelectQuery,
  DealStagesSelectQuery,
} from "@/graphql/types";
import dayjs from "dayjs";
import CustomAvatar from "../custom-avatar";

type AuditNode = NonNullable<
  GetFieldsFromList<DashboardLatestActivitiesAuditsQuery>["data"][number]
>;
type AuditChangeNode = AuditNode["changes"][number];

const normalizeTargetEntityName = (entity?: string | null) => {
  if (!entity) {
    return undefined;
  }

  const withNamespaceRemoved = entity.split(/[\\/]/).pop() ?? entity;
  const trimmed = withNamespaceRemoved.replace(/Entity$/i, "").trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.toLowerCase();
};

const getEntityDisplayName = (entity?: string | null) => {
  const normalized = normalizeTargetEntityName(entity);

  if (!normalized) {
    return "record";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getChangeValue = (changes: AuditChangeNode[] | undefined, fields: string[]) => {
  if (!changes?.length) {
    return undefined;
  }

  const targetFields = new Set(fields.map((field) => field.toLowerCase()));
  const match = changes.find((change) => targetFields.has((change.field ?? "").toLowerCase()));
  const value = match?.to ?? match?.from;

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
};

const getCompanyIdFromChanges = (changes: AuditChangeNode[] | undefined) => {
  if (!changes?.length) {
    return undefined;
  }

  const companyChange = changes.find((change) => (change.field ?? "").toLowerCase() === "companyid");

  if (!companyChange || companyChange.to == null) {
    return undefined;
  }

  return String(companyChange.to);
};

const SUBSCRIPTION_TYPES: LiveEvent["type"][] = ["created", "updated", "deleted"];

const LatestActivities = () => {
  const {
    data: audit,
    isLoading: isLoadingAudit,
    isError: isAuditError,
    error: auditsError,
    refetch: refetchAudits,
  } = useList<GetFieldsFromList<DashboardLatestActivitiesAuditsQuery>>({
    resource: "audits",
    sorters: [
      {
        field: "createdAt",
        order: "desc",
      },
    ],
    pagination: {
      pageSize: 10,
    },
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
    },
    liveMode: "manual",
  });
  const auditEntries = useMemo(
    () => (audit?.data ?? []).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [audit?.data],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[LatestActivities] audit entries", auditEntries);
    }
  }, [auditEntries]);

  const uniqueDealIds = useMemo(() => {
    const ids = new Set<string>();

    auditEntries.forEach((entry) => {
      if (!entry?.targetId) {
        return;
      }

      const entity = normalizeTargetEntityName(entry.targetEntity);

      if (entity === "deal") {
        ids.add(String(entry.targetId));
      }
    });

    return Array.from(ids);
  }, [auditEntries]);

  const uniqueCompanyIds = useMemo(() => {
    const ids = new Set<string>();

    auditEntries.forEach((entry) => {
      if (!entry) {
        return;
      }

      const entity = normalizeTargetEntityName(entry.targetEntity);

      if (entry.targetId && entity === "company") {
        ids.add(String(entry.targetId));
      }

      const derivedCompanyId = getCompanyIdFromChanges(entry.changes);

      if (derivedCompanyId) {
        ids.add(derivedCompanyId);
      }
    });

    return Array.from(ids);
  }, [auditEntries]);
  const {
    data: deals,
    isError: isDealsError,
    error: dealsError,
    refetch: refetchDeals,
  } = useList<GetFieldsFromList<DashboardLatestActivitiesDealsQuery>>({
    resource: "deals",
    queryOptions: { enabled: uniqueDealIds.length > 0 },
    pagination: { mode: "off" },
    filters:
      uniqueDealIds.length > 0
        ? [
            {
              field: "id",
              operator: "in",
              value: uniqueDealIds,
            },
          ]
        : [],
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
    },
    liveMode: "manual",
  });

  useSubscription({
    channel: "resources/audits",
    types: SUBSCRIPTION_TYPES,
    params: {
      resource: "audits",
      subscriptionType: "useList",
      filters: [],
    },
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
    },
    onLiveEvent: () => {
      void refetchAudits();
    },
  });

  useSubscription({
    channel: "resources/deals",
    types: SUBSCRIPTION_TYPES,
    params: {
      resource: "deals",
      subscriptionType: "useList",
      filters: [],
    },
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
    },
    onLiveEvent: () => {
      void refetchDeals();
    },
  });

  const { queryResult: stagesQueryResult } = useSelect<GetFieldsFromList<DealStagesSelectQuery>>({
    resource: "dealStages",
    optionLabel: "title",
    pagination: {
      mode: "off",
    },
    meta: {
      gqlQuery: DEAL_STAGES_SELECT_QUERY,
    },
  });

  const stages = stagesQueryResult.data?.data ?? [];

  const {
    data: companies,
    isError: isCompaniesError,
    error: companiesError,
  } = useList<GetFieldsFromList<CompaniesSelectQuery>>({
    resource: "companies",
    queryOptions: { enabled: uniqueCompanyIds.length > 0 },
    pagination: { mode: "off" },
    filters:
      uniqueCompanyIds.length > 0
        ? [
            {
              field: "id",
              operator: "in",
              value: uniqueCompanyIds,
            },
          ]
        : [],
    meta: {
      gqlQuery: COMPANIES_SELECT_QUERY,
    },
    liveMode: "manual",
  });

  const stageTitleLookup = useMemo(() => {
    return stages.reduce<Record<string, string>>((accumulator, stage) => {
      if (!stage?.id) {
        return accumulator;
      }

      accumulator[String(stage.id)] = stage.title ?? String(stage.id);
      return accumulator;
    }, {});
  }, [stages]);

  const dealLookup = useMemo(() => {
    const nodes = deals?.data ?? [];

    return nodes.reduce<Record<string, (typeof nodes)[number]>>((accumulator, deal) => {
      accumulator[String(deal.id)] = deal;
      return accumulator;
    }, {});
  }, [deals?.data]);

  const companyLookup = useMemo(() => {
    const nodes = companies?.data ?? [];

    return nodes.reduce<Record<string, (typeof nodes)[number]>>((accumulator, company) => {
      accumulator[String(company.id)] = company;
      return accumulator;
    }, {});
  }, [companies?.data]);

  const activities = useMemo(() => {
    return auditEntries
      .map((item) => {
        if (!item) {
          return null;
        }

        const targetId = item.targetId != null ? String(item.targetId) : undefined;
        const normalizedEntity = normalizeTargetEntityName(item.targetEntity);
        const isDealAudit = normalizedEntity === "deal";
        const isCompanyAudit = normalizedEntity === "company";

        const derivedCompanyId = getCompanyIdFromChanges(item.changes);

        const deal = isDealAudit && targetId ? dealLookup[targetId] : undefined;
        const companyFromTarget = isCompanyAudit && targetId ? companyLookup[targetId] : undefined;
        const company = companyFromTarget ?? deal?.company ?? (derivedCompanyId ? companyLookup[derivedCompanyId] : undefined);

        const actor = item.user?.name ?? "System";
        const action = item.action?.toUpperCase();
        const stageChange = item.changes?.find(
          (change) => (change.field ?? "").toLowerCase() === "stageid",
        );
        const fromStage = stageChange?.from ? stageTitleLookup[String(stageChange.from)] ?? stageChange.from : undefined;
        const toStage = stageChange?.to
          ? stageTitleLookup[String(stageChange.to)] ?? stageChange.to
          : deal?.stage?.title;
        const companyName = company?.name ?? deal?.company?.name;
        const displayEntityName = getEntityDisplayName(item.targetEntity);
        const changeLabel = getChangeValue(item.changes, ["title", "name", "fullName"]);
        const baseSubject = (() => {
          if (isDealAudit) {
            return deal?.title ?? changeLabel ?? displayEntityName;
          }

          if (isCompanyAudit) {
            return companyName ?? changeLabel ?? displayEntityName;
          }

          return changeLabel ?? displayEntityName;
        })();

        let description: React.ReactNode;

        switch (action) {
          case "CREATE":
            description = (
              <Space size={4}>
                <Text strong>{actor}</Text>
                <Text>created</Text>
                <Text strong>{baseSubject}</Text>
                {companyName ? (
                  <>
                    <Text>for</Text>
                    <Text strong>{companyName}</Text>
                  </>
                ) : null}
              </Space>
            );
            break;
          case "DELETE":
            description = (
              <Space size={4}>
                <Text strong>{actor}</Text>
                <Text>deleted</Text>
                <Text strong>{baseSubject}</Text>
              </Space>
            );
            break;
          case "UPDATE":
            if (isDealAudit && stageChange) {
              description = (
                <Space size={4}>
                  <Text strong>{actor}</Text>
                  <Text>moved</Text>
                  <Text strong>{baseSubject}</Text>
                  {fromStage ? (
                    <>
                      <Text>from</Text>
                      <Text strong>{fromStage}</Text>
                    </>
                  ) : null}
                  {toStage ? (
                    <>
                      <Text>to</Text>
                      <Text strong>{toStage}</Text>
                    </>
                  ) : null}
                </Space>
              );
            } else {
              description = (
                <Space size={4}>
                  <Text strong>{actor}</Text>
                  <Text>updated</Text>
                  <Text strong>{baseSubject}</Text>
                </Space>
              );
            }
            break;
          default:
            description = (
              <Space size={4}>
                <Text strong>{actor}</Text>
                <Text>performed</Text>
                <Text strong>{action?.toLowerCase() ?? "an action"}</Text>
              </Space>
            );
            break;
        }

        const timestamp = item.createdAt
          ? dayjs(item.createdAt).format("MMM DD, YYYY - HH:mm")
          : dayjs().format("MMM DD, YYYY - HH:mm");

        const avatarName = company?.name ?? deal?.title ?? baseSubject;
        const avatarUrl = company?.avatarUrl ?? item.user?.avatarUrl ?? undefined;

        const avatarEntityType =
          company?.id != null
            ? "companies"
            : item.user?.id != null
              ? "users"
              : undefined;

        const avatarEntityId = company?.id ?? item.user?.id ?? undefined;

        return {
          id: String(item.id ?? `${item.targetId}-${timestamp}`),
          timestamp,
          avatarUrl,
          avatarName,
          avatarEntityType,
          avatarEntityId,
          description,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [auditEntries, companyLookup, dealLookup, stageTitleLookup]);
  const isLoading = isLoadingAudit;

  if (isAuditError) {
    console.error("LatestActivities failed to load audits", {
      auditsError,
    });
    return null;
  }

  if (isDealsError || stagesQueryResult.isError || isCompaniesError) {
    console.warn("LatestActivities rendering with partial data", {
      dealsError,
      stagesError: stagesQueryResult.error,
      companiesError,
    });
  }
  return (
    <Card
      styles={{
        header: { padding: "16px" },
        body: { padding: "0 1rem" },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <UnorderedListOutlined />
          <Text size="sm" style={{ marginLeft: "0.5rem" }}>
            Latest Activities
          </Text>
        </div>
      }
    >
      {isLoading ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: 5 }).map((_, i) => ({ id: i }))}
          renderItem={(_, index) => <LatestActivitiesSkeleton key={index} />}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={activities}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={item.timestamp}
                avatar={
                  <CustomAvatar
                    shape="square"
                    size={48}
                    entityType={item.avatarEntityType}
                    entityId={item.avatarEntityId}
                    src={item.avatarUrl ?? undefined}
                    name={item.avatarName}
                  />
                }
                description={item.description}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default LatestActivities;
