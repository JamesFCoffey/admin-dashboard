import CustomAvatar from '@/components/custom-avatar';
import { Text } from '@/components/text';
import { COMPANIES_LIST_QUERY } from '@/graphql/queries';
import { Company } from '@/graphql/schema.types';
import { SearchOutlined } from '@ant-design/icons';
import {
  CreateButton,
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  useTable,
} from '@refinedev/antd';
import { getDefaultFilter, useGo, HttpError } from '@refinedev/core';
import { Input, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { currencyNumber } from '@/utilities';

type TableCompany = Pick<Company, 'id' | 'name' | 'avatarUrl' | 'dealsAggregate'>;

export const CompanyList = ({ children }: React.PropsWithChildren) => {
  const go = useGo();
  const { tableProps, filters } = useTable<TableCompany, HttpError, { name?: string }>({
    resource: 'companies',
    onSearch: (values) => {
      return [
        {
          field: 'name',
          operator: 'contains',
          value: values?.name,
        },
      ];
    },
    pagination: {
      pageSize: 12,
    },
    sorters: {
      initial: [
        {
          field: 'createdAt',
          order: 'desc',
        },
      ],
    },
    filters: {
      initial: [
        {
          field: 'name',
          operator: 'contains' as const,
          value: undefined,
        },
      ],
    },
    meta: {
      gqlQuery: COMPANIES_LIST_QUERY,
    },
  });

  const nameFilter = getDefaultFilter('id', filters) as string[] | undefined;

  const columns: ColumnsType<TableCompany> = [
    {
      dataIndex: 'name',
      title: 'Company Title',
      defaultFilteredValue: nameFilter,
      filterIcon: <SearchOutlined />,
      filterDropdown: (props) => (
        <FilterDropdown {...props}>
          <Input placeholder="Search Company" />
        </FilterDropdown>
      ),
      render: (_: unknown, record: TableCompany) => (
        <Space>
          <CustomAvatar
            shape="square"
            name={record.name}
            src={record.avatarUrl}
            entityType="companies"
            entityId={record.id}
          />
          <Text style={{ whiteSpace: 'nowrap' }}>{record.name}</Text>
        </Space>
      ),
    },
    {
      key: 'openAmount',
      title: 'Open deals amount',
      render: (_: unknown, company: TableCompany) => (
        <Text>{currencyNumber(company?.dealsAggregate?.[0].sum?.value || 0)}</Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      fixed: 'right',
      render: (_: unknown, record: TableCompany) => (
        <Space>
          <EditButton hideText size="small" recordItemId={record.id} />
          <DeleteButton hideText size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <List
        breadcrumb={false}
        headerButtons={() => (
          <CreateButton
            onClick={() => {
              go({
                to: {
                  resource: 'companies',
                  action: 'create',
                },
                options: {
                  keepQuery: true,
                },
                type: 'replace',
              });
            }}
          />
        )}
      >
        <Table {...tableProps} columns={columns} pagination={{ ...tableProps.pagination }} />
      </List>
      {children}
    </div>
  );
};
