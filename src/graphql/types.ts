import type * as Types from './schema.types';

export type UpdateUserMutationVariables = Types.Exact<{
  input: Types.UpdateOneUserInput;
}>;


export type UpdateUserMutation = { updateOneUser: Pick<Types.User, 'id' | 'name' | 'avatarUrl' | 'email' | 'phone' | 'jobTitle'> };

export type CreateCompanyMutationVariables = Types.Exact<{
  input: Types.CreateOneCompanyInput;
}>;


export type CreateCompanyMutation = { createOneCompany: (
    Pick<Types.Company, 'id'>
    & { salesOwner: Pick<Types.User, 'id'> }
  ) };

export type UpdateCompanyMutationVariables = Types.Exact<{
  input: Types.UpdateOneCompanyInput;
}>;


export type UpdateCompanyMutation = { updateOneCompany: (
    Pick<Types.Company, 'id' | 'name' | 'totalRevenue' | 'industry' | 'companySize' | 'businessType' | 'country' | 'website' | 'avatarUrl'>
    & { salesOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
  ) };

export type UpdateTaskStageMutationVariables = Types.Exact<{
  input: Types.UpdateOneTaskInput;
}>;


export type UpdateTaskStageMutation = { updateOneTask: Pick<Types.Task, 'id'> };

export type CreateTaskMutationVariables = Types.Exact<{
  input: Types.CreateOneTaskInput;
}>;


export type CreateTaskMutation = { createOneTask: (
    Pick<Types.Task, 'id' | 'title'>
    & { stage?: Types.Maybe<Pick<Types.TaskStage, 'id' | 'title'>> }
  ) };

export type UpdateTaskMutationVariables = Types.Exact<{
  input: Types.UpdateOneTaskInput;
}>;


export type UpdateTaskMutation = { updateOneTask: (
    Pick<Types.Task, 'id' | 'title' | 'completed' | 'description' | 'dueDate'>
    & { stage?: Types.Maybe<Pick<Types.TaskStage, 'id' | 'title'>>, users: Array<Pick<Types.User, 'id' | 'name' | 'avatarUrl'>>, checklist: Array<Pick<Types.CheckListItem, 'title' | 'checked'>> }
  ) };

export type CreateContactMutationVariables = Types.Exact<{
  input: Types.CreateOneContactInput;
}>;


export type CreateContactMutation = { createOneContact: (
    Pick<Types.Contact, 'id' | 'name' | 'jobTitle' | 'email' | 'phone' | 'status' | 'avatarUrl' | 'createdAt'>
    & { salesOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
  ) };

export type UpdateContactMutationVariables = Types.Exact<{
  input: Types.UpdateOneContactInput;
}>;


export type UpdateContactMutation = { updateOneContact: (
    Pick<Types.Contact, 'id' | 'name' | 'jobTitle' | 'email' | 'phone' | 'status' | 'avatarUrl' | 'createdAt'>
    & { salesOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
  ) };

export type DeleteContactMutationVariables = Types.Exact<{
  input: Types.DeleteOneContactInput;
}>;


export type DeleteContactMutation = { deleteOneContact: Pick<Types.ContactDeleteResponse, 'id'> };

export type CreateDealMutationVariables = Types.Exact<{
  input: Types.CreateOneDealInput;
}>;


export type CreateDealMutation = { createOneDeal: (
    Pick<Types.Deal, 'id' | 'title' | 'value' | 'createdAt'>
    & { stage?: Types.Maybe<Pick<Types.DealStage, 'id' | 'title'>>, company: Pick<Types.Company, 'id' | 'name' | 'avatarUrl'>, dealOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
  ) };

export type UpdateDealMutationVariables = Types.Exact<{
  input: Types.UpdateOneDealInput;
}>;


export type UpdateDealMutation = { updateOneDeal: (
    Pick<Types.Deal, 'id' | 'title' | 'value' | 'createdAt'>
    & { stage?: Types.Maybe<Pick<Types.DealStage, 'id' | 'title'>>, company: Pick<Types.Company, 'id' | 'name' | 'avatarUrl'>, dealOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
  ) };

export type DeleteDealMutationVariables = Types.Exact<{
  input: Types.DeleteOneDealInput;
}>;


export type DeleteDealMutation = { deleteOneDeal: Pick<Types.DealDeleteResponse, 'id'> };

export type CreateEventMutationVariables = Types.Exact<{
  input: Types.CreateOneEventInput;
}>;


export type CreateEventMutation = { createOneEvent: Pick<Types.Event, 'id' | 'title' | 'color' | 'startDate' | 'endDate'> };

export type UpdateEventMutationVariables = Types.Exact<{
  input: Types.UpdateOneEventInput;
}>;


export type UpdateEventMutation = { updateOneEvent: Pick<Types.Event, 'id' | 'title' | 'color' | 'startDate' | 'endDate'> };

export type DeleteEventMutationVariables = Types.Exact<{
  input: Types.DeleteOneEventInput;
}>;


export type DeleteEventMutation = { deleteOneEvent: Pick<Types.EventDeleteResponse, 'id'> };

export type DashboardTotalCountsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DashboardTotalCountsQuery = { companies: Pick<Types.CompanyConnection, 'totalCount'>, contacts: Pick<Types.ContactConnection, 'totalCount'>, deals: Pick<Types.DealConnection, 'totalCount'> };

export type DashboardCalendarUpcomingEventsQueryVariables = Types.Exact<{
  filter: Types.EventFilter;
  sorting?: Types.InputMaybe<Array<Types.EventSort> | Types.EventSort>;
  paging: Types.OffsetPaging;
}>;


export type DashboardCalendarUpcomingEventsQuery = { events: (
    Pick<Types.EventConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.Event, 'id' | 'title' | 'color' | 'startDate' | 'endDate'>> }
  ) };

export type DashboardDealsChartQueryVariables = Types.Exact<{
  filter: Types.DealStageFilter;
  sorting?: Types.InputMaybe<Array<Types.DealStageSort> | Types.DealStageSort>;
  paging?: Types.InputMaybe<Types.OffsetPaging>;
}>;


export type DashboardDealsChartQuery = { dealStages: (
    Pick<Types.DealStageConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.DealStage, 'id' | 'title'>
      & { dealsAggregate: Array<{ groupBy?: Types.Maybe<Pick<Types.DealStageDealsAggregateGroupBy, 'closeDateMonth' | 'closeDateYear'>>, sum?: Types.Maybe<Pick<Types.DealStageDealsSumAggregate, 'value'>> }> }
    )> }
  ) };

export type DashboardLatestActivitiesDealsQueryVariables = Types.Exact<{
  filter: Types.DealFilter;
  sorting?: Types.InputMaybe<Array<Types.DealSort> | Types.DealSort>;
  paging?: Types.InputMaybe<Types.OffsetPaging>;
}>;


export type DashboardLatestActivitiesDealsQuery = { deals: (
    Pick<Types.DealConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Deal, 'id' | 'title' | 'createdAt'>
      & { stage?: Types.Maybe<Pick<Types.DealStage, 'id' | 'title'>>, company: Pick<Types.Company, 'id' | 'name' | 'avatarUrl'> }
    )> }
  ) };

export type DashboardLatestActivitiesAuditsQueryVariables = Types.Exact<{
  filter: Types.AuditFilter;
  sorting?: Types.InputMaybe<Array<Types.AuditSort> | Types.AuditSort>;
  paging?: Types.InputMaybe<Types.OffsetPaging>;
}>;


export type DashboardLatestActivitiesAuditsQuery = { audits: (
    Pick<Types.AuditConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Audit, 'id' | 'action' | 'targetEntity' | 'targetId' | 'createdAt'>
      & { changes: Array<Pick<Types.AuditChange, 'field' | 'from' | 'to'>>, user?: Types.Maybe<Pick<Types.User, 'id' | 'name' | 'avatarUrl'>> }
    )> }
  ) };

export type CompaniesListQueryVariables = Types.Exact<{
  filter: Types.CompanyFilter;
  sorting?: Types.InputMaybe<Array<Types.CompanySort> | Types.CompanySort>;
  paging: Types.OffsetPaging;
}>;


export type CompaniesListQuery = { companies: (
    Pick<Types.CompanyConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Company, 'id' | 'name' | 'avatarUrl'>
      & { dealsAggregate: Array<{ sum?: Types.Maybe<Pick<Types.CompanyDealsSumAggregate, 'value'>> }> }
    )> }
  ) };

export type UsersSelectQueryVariables = Types.Exact<{
  filter: Types.UserFilter;
  sorting?: Types.InputMaybe<Array<Types.UserSort> | Types.UserSort>;
  paging: Types.OffsetPaging;
}>;


export type UsersSelectQuery = { users: (
    Pick<Types.UserConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.User, 'id' | 'name' | 'avatarUrl'>> }
  ) };

export type CompaniesSelectQueryVariables = Types.Exact<{
  filter: Types.CompanyFilter;
  sorting?: Types.InputMaybe<Array<Types.CompanySort> | Types.CompanySort>;
  paging: Types.OffsetPaging;
}>;


export type CompaniesSelectQuery = { companies: (
    Pick<Types.CompanyConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.Company, 'id' | 'name' | 'avatarUrl'>> }
  ) };

export type CompanyContactsTableQueryVariables = Types.Exact<{
  filter: Types.ContactFilter;
  sorting?: Types.InputMaybe<Array<Types.ContactSort> | Types.ContactSort>;
  paging: Types.OffsetPaging;
}>;


export type CompanyContactsTableQuery = { contacts: (
    Pick<Types.ContactConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Contact, 'id' | 'name' | 'avatarUrl' | 'jobTitle' | 'email' | 'phone' | 'status' | 'createdAt'>
      & { salesOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
    )> }
  ) };

export type DealsListQueryVariables = Types.Exact<{
  filter: Types.DealFilter;
  sorting?: Types.InputMaybe<Array<Types.DealSort> | Types.DealSort>;
  paging: Types.OffsetPaging;
}>;


export type DealsListQuery = { deals: (
    Pick<Types.DealConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Deal, 'id' | 'title' | 'value' | 'createdAt'>
      & { stage?: Types.Maybe<Pick<Types.DealStage, 'id' | 'title'>>, company: Pick<Types.Company, 'id' | 'name' | 'avatarUrl'>, dealOwner: Pick<Types.User, 'id' | 'name' | 'avatarUrl'> }
    )> }
  ) };

export type TaskStagesQueryVariables = Types.Exact<{
  filter: Types.TaskStageFilter;
  sorting?: Types.InputMaybe<Array<Types.TaskStageSort> | Types.TaskStageSort>;
  paging: Types.OffsetPaging;
}>;


export type TaskStagesQuery = { taskStages: (
    Pick<Types.TaskStageConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.TaskStage, 'id' | 'title'>> }
  ) };

export type TasksQueryVariables = Types.Exact<{
  filter: Types.TaskFilter;
  sorting?: Types.InputMaybe<Array<Types.TaskSort> | Types.TaskSort>;
  paging: Types.OffsetPaging;
}>;


export type TasksQuery = { tasks: (
    Pick<Types.TaskConnection, 'totalCount'>
    & { nodes: Array<(
      Pick<Types.Task, 'id' | 'title' | 'description' | 'dueDate' | 'completed' | 'stageId' | 'createdAt' | 'updatedAt'>
      & { users: Array<Pick<Types.User, 'id' | 'name' | 'avatarUrl'>> }
    )> }
  ) };

export type TaskStagesSelectQueryVariables = Types.Exact<{
  filter: Types.TaskStageFilter;
  sorting?: Types.InputMaybe<Array<Types.TaskStageSort> | Types.TaskStageSort>;
  paging: Types.OffsetPaging;
}>;


export type TaskStagesSelectQuery = { taskStages: (
    Pick<Types.TaskStageConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.TaskStage, 'id' | 'title'>> }
  ) };

export type DealStagesSelectQueryVariables = Types.Exact<{
  filter: Types.DealStageFilter;
  sorting?: Types.InputMaybe<Array<Types.DealStageSort> | Types.DealStageSort>;
  paging: Types.OffsetPaging;
}>;


export type DealStagesSelectQuery = { dealStages: (
    Pick<Types.DealStageConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.DealStage, 'id' | 'title'>> }
  ) };

export type EventCategoriesSelectQueryVariables = Types.Exact<{
  filter: Types.EventCategoryFilter;
  sorting?: Types.InputMaybe<Array<Types.EventCategorySort> | Types.EventCategorySort>;
  paging: Types.OffsetPaging;
}>;


export type EventCategoriesSelectQuery = { eventCategories: (
    Pick<Types.EventCategoryConnection, 'totalCount'>
    & { nodes: Array<Pick<Types.EventCategory, 'id' | 'title'>> }
  ) };
