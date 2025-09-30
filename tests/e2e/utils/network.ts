import type { Page, Route } from '@playwright/test';

type MockUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  accessToken: string;
};

type CompanyNode = {
  id: string;
  name: string;
  avatarUrl: string | null;
  dealsAggregate: Array<{ sum: { value: number | null } }>;
};

type ContactNode = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  status: string | null;
  avatarUrl: string | null;
  salesOwner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
};

type TaskNode = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  stageId: string | null;
  users: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

type TaskStageNode = {
  id: string;
  title: string;
};

type EventNode = {
  id: string;
  title: string;
  color: string;
  startDate: string;
  endDate: string;
};

type DealStageAggregateNode = {
  id: string;
  title: string;
  dealsAggregate: Array<{
    groupBy: {
      closeDateMonth: number;
      closeDateYear: number;
    };
    sum: {
      value: number | null;
    };
  }>;
};

type AuditNode = {
  id: string;
  action: string;
  targetEntity: string;
  targetId: string;
  changes: Array<{ field: string; from: string | null; to: string | null }>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

type LatestDealNode = {
  id: string;
  title: string;
  stage: { id: string; title: string } | null;
  company: { id: string; name: string; avatarUrl: string | null } | null;
  createdAt: string;
};

type MockData = {
  user: MockUser;
  dashboardTotals: {
    companies: number;
    contacts: number;
    deals: number;
  };
  upcomingEvents: EventNode[];
  dealStages: DealStageAggregateNode[];
  latestAudits: AuditNode[];
  latestDeals: LatestDealNode[];
  companies: CompanyNode[];
  contacts: ContactNode[];
  users: Array<{ id: string; name: string; avatarUrl: string | null }>;
  tasks: TaskNode[];
  taskStages: TaskStageNode[];
};

const defaultUser: MockUser = {
  id: 'user-1',
  name: 'Michael Scott',
  email: 'michael.scott@dundermifflin.com',
  accessToken: 'demo-access-token',
  image: null,
};

const defaultData: MockData = {
  user: defaultUser,
  dashboardTotals: {
    companies: 12,
    contacts: 32,
    deals: 18,
  },
  upcomingEvents: [
    {
      id: 'event-1',
      title: 'Quarterly planning',
      color: '#1677ff',
      startDate: '2024-06-03T14:00:00.000Z',
      endDate: '2024-06-03T15:00:00.000Z',
    },
  ],
  dealStages: [
    {
      id: 'stage-won',
      title: 'WON',
      dealsAggregate: [
        {
          groupBy: { closeDateMonth: 1, closeDateYear: 2024 },
          sum: { value: 20000 },
        },
        {
          groupBy: { closeDateMonth: 2, closeDateYear: 2024 },
          sum: { value: 32000 },
        },
      ],
    },
    {
      id: 'stage-lost',
      title: 'LOST',
      dealsAggregate: [
        {
          groupBy: { closeDateMonth: 1, closeDateYear: 2024 },
          sum: { value: 5000 },
        },
      ],
    },
  ],
  latestAudits: [
    {
      id: 'audit-1',
      action: 'CREATE',
      targetEntity: 'Deal',
      targetId: 'deal-1',
      changes: [
        { field: 'title', from: null, to: 'Paper renewal' },
        { field: 'value', from: null, to: '15000' },
      ],
      createdAt: '2024-05-12T10:15:00.000Z',
      user: {
        id: 'user-1',
        name: 'Michael Scott',
        avatarUrl: null,
      },
    },
  ],
  latestDeals: [
    {
      id: 'deal-1',
      title: 'Paper renewal',
      stage: { id: 'stage-won', title: 'WON' },
      company: {
        id: 'company-1',
        name: 'Dunder Mifflin',
        avatarUrl: null,
      },
      createdAt: '2024-05-11T09:45:00.000Z',
    },
  ],
  companies: [
    {
      id: 'company-1',
      name: 'Dunder Mifflin',
      avatarUrl: null,
      dealsAggregate: [{ sum: { value: 125000 } }],
    },
  ],
  contacts: [
    {
      id: 'contact-1',
      companyId: 'company-1',
      name: 'Pam Beesly',
      email: 'pam@dundermifflin.com',
      jobTitle: 'Office Administrator',
      phone: '+1 570-555-0199',
      status: 'NEW',
      avatarUrl: null,
      salesOwner: {
        id: 'user-1',
        name: 'Michael Scott',
        avatarUrl: null,
      },
      createdAt: '2024-04-01T12:00:00.000Z',
    },
  ],
  users: [
    {
      id: 'user-1',
      name: 'Michael Scott',
      avatarUrl: null,
    },
    {
      id: 'user-2',
      name: 'Jim Halpert',
      avatarUrl: null,
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Plan quarterly roadmap',
      description: 'Gather inputs and prepare roadmap presentation',
      dueDate: '2024-06-15T00:00:00.000Z',
      completed: false,
      stageId: null,
      users: [
        {
          id: 'user-2',
          name: 'Jim Halpert',
          avatarUrl: null,
        },
      ],
      createdAt: '2024-05-01T09:00:00.000Z',
      updatedAt: '2024-05-10T09:00:00.000Z',
    },
  ],
  taskStages: [
    { id: 'stage-1', title: 'TODO' },
    { id: 'stage-2', title: 'IN PROGRESS' },
    { id: 'stage-3', title: 'IN REVIEW' },
    { id: 'stage-4', title: 'DONE' },
  ],
};

const jsonResponse = (body: unknown) =>
  ({
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as const;

export const setupAuth = async (
  page: Page,
  options: { user?: MockUser; authenticated?: boolean } = {},
) => {
  const user = options.user ?? defaultUser;
  let authenticated = options.authenticated ?? false;

  await page.route('**/api/auth/providers**', async (route) => {
    await route.fulfill(
      jsonResponse({
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          signinUrl: '/api/auth/signin/credentials',
          callbackUrl: '/api/auth/callback/credentials',
        },
        github: {
          id: 'github',
          name: 'GitHub',
          type: 'oauth',
          signinUrl: '/api/auth/signin/github',
          callbackUrl: '/api/auth/callback/github',
        },
      }),
    );
  });

  await page.route('**/api/auth/csrf**', async (route) => {
    await route.fulfill(jsonResponse({ csrfToken: 'test-csrf-token' }));
  });

  await page.route('**/api/auth/session**', async (route) => {
    const body = authenticated
      ? {
          user,
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      : null;

    await route.fulfill(jsonResponse(body));
  });

  await page.route('**/api/auth/signin/credentials**', async (route) => {
    await route.fulfill(
      jsonResponse({ ok: true, status: 200, url: '/api/auth/callback/credentials' }),
    );
  });

  await page.route('**/api/auth/callback/credentials**', async (route) => {
    authenticated = true;
    await route.fulfill(jsonResponse({ ok: true, status: 200, url: '/' }));
  });

  await page.route('**/api/auth/_log**', async (route) => {
    await route.fulfill(jsonResponse({}));
  });

  return {
    user,
    setAuthenticated(state: boolean) {
      authenticated = state;
    },
  };
};

export const setupGraphQLMocks = async (page: Page, overrides: Partial<MockData> = {}) => {
  const state: MockData = {
    user: overrides.user ?? { ...defaultData.user },
    dashboardTotals: overrides.dashboardTotals ?? { ...defaultData.dashboardTotals },
    upcomingEvents: overrides.upcomingEvents
      ? [...overrides.upcomingEvents]
      : [...defaultData.upcomingEvents],
    dealStages: overrides.dealStages ? [...overrides.dealStages] : [...defaultData.dealStages],
    latestAudits: overrides.latestAudits
      ? [...overrides.latestAudits]
      : [...defaultData.latestAudits],
    latestDeals: overrides.latestDeals ? [...overrides.latestDeals] : [...defaultData.latestDeals],
    companies: overrides.companies ? [...overrides.companies] : [...defaultData.companies],
    contacts: overrides.contacts ? [...overrides.contacts] : [...defaultData.contacts],
    users: overrides.users ? [...overrides.users] : [...defaultData.users],
    tasks: overrides.tasks ? [...overrides.tasks] : [...defaultData.tasks],
    taskStages: overrides.taskStages ? [...overrides.taskStages] : [...defaultData.taskStages],
  };

  let contactCounter = state.contacts.length;

  const fulfill = async (route: Route, payload: unknown) => {
    await route.fulfill(jsonResponse({ data: payload }));
  };

  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill(jsonResponse({ data: {} }));
      return;
    }

    const rawBody = route.request().postData() ?? '{}';
    let body: { query?: string; variables?: Record<string, unknown> };
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      await route.fulfill(jsonResponse({ data: {} }));
      return;
    }

    const query = body.query ?? '';
    const variables = body.variables ?? {};
    const vars = variables as Record<string, any>;

    if (query.includes('mutation Login')) {
      await fulfill(route, { login: { accessToken: state.user.accessToken } });
      return;
    }

    if (query.includes('mutation Register')) {
      await fulfill(route, {
        register: {
          id: 'user-registered',
          email: vars.email ?? 'new.user@example.com',
        },
      });
      return;
    }

    if (query.includes('mutation UpdateUser')) {
      await fulfill(route, {
        updateOneUser: {
          id: vars.input?.id ?? state.user.id,
          name: vars.input?.update?.name ?? state.user.name,
          email: state.user.email,
          phone: null,
          jobTitle: null,
          avatarUrl: null,
        },
      });
      return;
    }

    if (query.includes(' query Me') || query.includes('query Me')) {
      await fulfill(route, {
        me: {
          id: state.user.id,
          name: state.user.name,
          email: state.user.email,
        },
      });
      return;
    }

    if (query.includes('DashboardTotalCounts')) {
      await fulfill(route, {
        companies: { totalCount: state.dashboardTotals.companies },
        contacts: { totalCount: state.dashboardTotals.contacts },
        deals: { totalCount: state.dashboardTotals.deals },
      });
      return;
    }

    if (query.includes('DashboardDealsChart')) {
      await fulfill(route, {
        dealStages: {
          totalCount: state.dealStages.length,
          nodes: state.dealStages,
        },
      });
      return;
    }

    if (query.includes('DashboardCalendarUpcomingEvents')) {
      await fulfill(route, {
        events: {
          totalCount: state.upcomingEvents.length,
          nodes: state.upcomingEvents,
        },
      });
      return;
    }

    if (query.includes('DashboardLatestActivitiesAudits')) {
      await fulfill(route, {
        audits: {
          totalCount: state.latestAudits.length,
          nodes: state.latestAudits,
        },
      });
      return;
    }

    if (query.includes('DashboardLatestActivitiesDeals')) {
      await fulfill(route, {
        deals: {
          totalCount: state.latestDeals.length,
          nodes: state.latestDeals,
        },
      });
      return;
    }

    if (query.includes('CompaniesList')) {
      await fulfill(route, {
        companies: {
          totalCount: state.companies.length,
          nodes: state.companies,
        },
      });
      return;
    }

    if (query.includes('CompanyContactsTable')) {
      const companyId =
        typeof vars.filter === 'object' && Array.isArray((vars.filter as { and?: unknown }).and)
          ? ((
              ((vars.filter as { and?: Array<Record<string, any>> }).and ?? []).find(
                (filter) => typeof filter === 'object' && 'company' in filter,
              ) as { company?: { id?: { eq?: string } } } | undefined
            )?.company?.id?.eq ?? state.contacts[0]?.companyId)
          : state.contacts[0]?.companyId;

      const nodes = state.contacts.filter((contact) => contact.companyId === companyId);
      await fulfill(route, {
        contacts: {
          totalCount: nodes.length,
          nodes,
        },
      });
      return;
    }

    if (query.includes('UsersSelect')) {
      await fulfill(route, {
        users: {
          totalCount: state.users.length,
          nodes: state.users,
        },
      });
      return;
    }

    if (query.includes('TaskStagesSelect')) {
      await fulfill(route, {
        taskStages: {
          totalCount: state.taskStages.length,
          nodes: state.taskStages,
        },
      });
      return;
    }

    if (query.includes('DealStagesSelect')) {
      await fulfill(route, {
        dealStages: {
          totalCount: state.dealStages.length,
          nodes: state.dealStages,
        },
      });
      return;
    }

    if (query.includes('EventCategoriesSelect')) {
      await fulfill(route, {
        eventCategories: {
          totalCount: 0,
          nodes: [],
        },
      });
      return;
    }

    if (query.includes('TASK_STAGES') || query.includes(' TaskStages')) {
      await fulfill(route, {
        taskStages: {
          totalCount: state.taskStages.length,
          nodes: state.taskStages,
        },
      });
      return;
    }

    if (query.includes(' query Tasks') || query.includes(' Tasks(')) {
      await fulfill(route, {
        tasks: {
          totalCount: state.tasks.length,
          nodes: state.tasks,
        },
      });
      return;
    }

    if (query.includes('DealsList')) {
      await fulfill(route, {
        deals: {
          totalCount: state.latestDeals.length,
          nodes: state.latestDeals.map((deal) => ({
            ...deal,
            value: 25000,
            dealOwner: {
              id: state.user.id,
              name: state.user.name,
              avatarUrl: state.user.image ?? null,
            },
          })),
        },
      });
      return;
    }

    if (query.includes('mutation CreateContact')) {
      const input = vars.input as { contact?: Record<string, any> } | undefined;
      const payload = input?.contact ?? {};
      contactCounter += 1;
      const newContact: ContactNode = {
        id: `contact-${contactCounter}`,
        companyId: String(
          payload.company?.connect?.id ??
            payload.companyId ??
            state.contacts[0]?.companyId ??
            'company-1',
        ),
        name: String(payload.name ?? 'New Contact'),
        email: String(payload.email ?? 'contact@example.com'),
        jobTitle: (payload.jobTitle as string | null | undefined) ?? null,
        phone: (payload.phone as string | null | undefined) ?? null,
        status: (payload.status as string | null | undefined) ?? 'NEW',
        avatarUrl: null,
        salesOwner: payload.salesOwner?.connect?.id
          ? (state.users.find(
              (user) => String(user.id) === String(payload.salesOwner.connect.id),
            ) ?? null)
          : (state.contacts[0]?.salesOwner ?? null),
        createdAt: new Date().toISOString(),
      };
      state.contacts.push(newContact);
      await fulfill(route, {
        createOneContact: {
          ...newContact,
          salesOwner: newContact.salesOwner,
        },
      });
      return;
    }

    if (query.includes('mutation UpdateContact')) {
      const input = vars.input as { id?: string; update?: Record<string, any> } | undefined;
      const contactId = String(input?.id ?? '');
      const existing = state.contacts.find((contact) => contact.id === contactId);
      if (existing && input?.update) {
        existing.name = String(input.update.name ?? existing.name);
        existing.email = String(input.update.email ?? existing.email);
        existing.jobTitle =
          (input.update.jobTitle as string | null | undefined) ?? existing.jobTitle;
        existing.phone = (input.update.phone as string | null | undefined) ?? existing.phone;
        existing.status = (input.update.status as string | null | undefined) ?? existing.status;
        if (input.update.salesOwner?.connect?.id) {
          const ownerId = String(input.update.salesOwner.connect.id);
          existing.salesOwner =
            state.users.find((user) => String(user.id) === ownerId) ?? existing.salesOwner;
        }
      }
      await fulfill(route, {
        updateOneContact: existing ?? null,
      });
      return;
    }

    if (query.includes('mutation DeleteContact')) {
      const input = vars.input as { id?: string } | undefined;
      const contactId = String(input?.id ?? '');
      state.contacts = state.contacts.filter((contact) => contact.id !== contactId);
      await fulfill(route, {
        deleteOneContact: { id: contactId },
      });
      return;
    }

    if (query.includes('mutation UpdateTaskStage')) {
      const input = vars.input as { id?: string; update?: Record<string, any> } | undefined;
      const taskId = String(input?.id ?? '');
      const nextStageId =
        (input?.update?.stage?.connect?.id as string | null | undefined) ??
        (input?.update?.stageId as string | null | undefined) ??
        null;
      const task = state.tasks.find((item) => item.id === taskId);
      if (task) {
        task.stageId = nextStageId;
      }
      await fulfill(route, {
        updateOneTask: { id: taskId },
      });
      return;
    }

    if (query.includes('mutation CreateCompany')) {
      const input = vars.input as { company?: Record<string, any> } | undefined;
      const nextId = `company-${state.companies.length + 1}`;
      const company: CompanyNode = {
        id: nextId,
        name: String(input?.company?.name ?? 'New Company'),
        avatarUrl: null,
        dealsAggregate: [{ sum: { value: 0 } }],
      };
      state.companies.push(company);
      await fulfill(route, {
        createOneCompany: {
          id: company.id,
          salesOwner: { id: input?.company?.salesOwner?.connect?.id ?? state.user.id },
        },
      });
      return;
    }

    if (query.includes('mutation UpdateCompany')) {
      const input = vars.input as { id?: string; update?: Record<string, any> } | undefined;
      const companyId = String(input?.id ?? '');
      const company = state.companies.find((item) => item.id === companyId);
      if (company && input?.update?.name) {
        company.name = String(input.update.name);
      }
      await fulfill(route, {
        updateOneCompany: company ?? null,
      });
      return;
    }

    if (query.includes(' company(') && !query.includes('companies(')) {
      const companyId =
        (vars.id as string | undefined) ??
        (vars.filter as { id?: { eq?: string } } | undefined)?.id?.eq ??
        state.companies[0]?.id;
      const company = state.companies.find((item) => item.id === companyId) ?? null;
      await fulfill(route, { company });
      return;
    }

    await fulfill(route, {});
  });

  return state;
};
