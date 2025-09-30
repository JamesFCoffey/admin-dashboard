import gql from 'graphql-tag';

// Mutation to update user
export const UPDATE_USER_MUTATION = gql`
  # The ! after the type means that it is required
  mutation UpdateUser($input: UpdateOneUserInput!) {
    # call the updateOneUser mutation with the input and pass the $input argument
    # $variableName is a convention for GraphQL variables
    updateOneUser(input: $input) {
      id
      name
      avatarUrl
      email
      phone
      jobTitle
    }
  }
`;

// Mutation to create company
export const CREATE_COMPANY_MUTATION = gql`
  mutation CreateCompany($input: CreateOneCompanyInput!) {
    createOneCompany(input: $input) {
      id
      salesOwner {
        id
      }
    }
  }
`;

// Mutation to update company details
export const UPDATE_COMPANY_MUTATION = gql`
  mutation UpdateCompany($input: UpdateOneCompanyInput!) {
    updateOneCompany(input: $input) {
      id
      name
      totalRevenue
      industry
      companySize
      businessType
      country
      website
      avatarUrl
      salesOwner {
        id
        name
        avatarUrl
      }
    }
  }
`;

// Mutation to update task stage of a task
export const UPDATE_TASK_STAGE_MUTATION = gql`
  mutation UpdateTaskStage($input: UpdateOneTaskInput!) {
    updateOneTask(input: $input) {
      id
    }
  }
`;

// Mutation to create a new task
export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateOneTaskInput!) {
    createOneTask(input: $input) {
      id
      title
      stage {
        id
        title
      }
    }
  }
`;

// Mutation to update a task details
export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($input: UpdateOneTaskInput!) {
    updateOneTask(input: $input) {
      id
      title
      completed
      description
      dueDate
      stage {
        id
        title
      }
      users {
        id
        name
        avatarUrl
      }
      checklist {
        title
        checked
      }
    }
  }
`;

export const CREATE_CONTACT_MUTATION = gql`
  mutation CreateContact($input: CreateOneContactInput!) {
    createOneContact(input: $input) {
      id
      name
      jobTitle
      email
      phone
      status
      avatarUrl
      createdAt
      salesOwner {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContact($input: UpdateOneContactInput!) {
    updateOneContact(input: $input) {
      id
      name
      jobTitle
      email
      phone
      status
      avatarUrl
      createdAt
      salesOwner {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const DELETE_CONTACT_MUTATION = gql`
  mutation DeleteContact($input: DeleteOneContactInput!) {
    deleteOneContact(input: $input) {
      id
    }
  }
`;

export const CREATE_DEAL_MUTATION = gql`
  mutation CreateDeal($input: CreateOneDealInput!) {
    createOneDeal(input: $input) {
      id
      title
      value
      createdAt
      stage {
        id
        title
      }
      company {
        id
        name
        avatarUrl
      }
      dealOwner {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const UPDATE_DEAL_MUTATION = gql`
  mutation UpdateDeal($input: UpdateOneDealInput!) {
    updateOneDeal(input: $input) {
      id
      title
      value
      createdAt
      stage {
        id
        title
      }
      company {
        id
        name
        avatarUrl
      }
      dealOwner {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const DELETE_DEAL_MUTATION = gql`
  mutation DeleteDeal($input: DeleteOneDealInput!) {
    deleteOneDeal(input: $input) {
      id
    }
  }
`;

export const CREATE_EVENT_MUTATION = gql`
  mutation CreateEvent($input: CreateOneEventInput!) {
    createOneEvent(input: $input) {
      id
      title
      color
      startDate
      endDate
    }
  }
`;

export const UPDATE_EVENT_MUTATION = gql`
  mutation UpdateEvent($input: UpdateOneEventInput!) {
    updateOneEvent(input: $input) {
      id
      title
      color
      startDate
      endDate
    }
  }
`;

export const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($input: DeleteOneEventInput!) {
    deleteOneEvent(input: $input) {
      id
    }
  }
`;
