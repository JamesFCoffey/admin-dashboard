import React from 'react';
import { render, screen } from '@testing-library/react';

import LatestActivities from '@/components/home/latest-activities';

import { useList, useSubscription } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';

jest.mock('@refinedev/core', () => {
  const actual = jest.requireActual<typeof import('@refinedev/core')>('@refinedev/core');

  return {
    ...actual,
    useList: jest.fn(),
    useSubscription: jest.fn(),
  };
});

jest.mock('@refinedev/antd', () => {
  const actual = jest.requireActual<typeof import('@refinedev/antd')>('@refinedev/antd');

  return {
    ...actual,
    useSelect: jest.fn(),
  };
});

const mockUseList = useList as unknown as jest.Mock;
const mockUseSubscription = useSubscription as unknown as jest.Mock;
const mockUseSelect = useSelect as unknown as jest.Mock;

describe('LatestActivities', () => {
  const baseAudit = {
    id: '1',
    action: 'CREATE',
    targetEntity: 'DealEntity',
    targetId: 'deal-1',
    createdAt: '2024-07-15T10:30:00.000Z',
    user: {
      id: 'user-1',
      name: 'Jane Doe',
      avatarUrl: null,
    },
    changes: [],
  } as const;

  const noopRefetch = jest.fn();

  beforeEach(() => {
    mockUseList.mockReset();
    mockUseSelect.mockReset();
    mockUseSubscription.mockReset();

    noopRefetch.mockReset();

    const defaultListValue = {
      data: { data: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: noopRefetch,
    };

    mockUseList.mockImplementation(() => ({ ...defaultListValue }));

    mockUseSubscription.mockReturnValue(undefined);

    mockUseSelect.mockReturnValue({
      queryResult: {
        data: { data: [] },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      },
    });
  });

  it('renders audit entries even when related lookups error', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const dealsError = new Error('deals failed');
    const companiesError = new Error('companies failed');
    const stagesError = new Error('stages failed');

    mockUseList
      .mockImplementationOnce(() => ({
        data: { data: [baseAudit] },
        isLoading: false,
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: true,
        error: dealsError,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: true,
        error: companiesError,
        refetch: noopRefetch,
      }));

    mockUseSelect.mockReturnValue({
      queryResult: {
        data: { data: [] },
        isLoading: false,
        isFetching: false,
        isError: true,
        error: stagesError,
      },
    });

    render(<LatestActivities />);

    expect(screen.getByText(/Latest Activities/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();

    expect(warnSpy).toHaveBeenCalledWith(
      'LatestActivities rendering with partial data',
      expect.objectContaining({
        dealsError,
        companiesError,
        stagesError,
      }),
    );

    warnSpy.mockRestore();
  });

  it('normalizes entity names and renders deal details', () => {
    const auditEntry = {
      ...baseAudit,
      action: 'CREATE',
      targetEntity: 'Deal',
      targetId: 'deal-1',
      user: {
        id: 'user-2',
        name: 'James Coffey',
        avatarUrl: null,
      },
      changes: [
        { field: 'title', from: null, to: 'Oriental Bronze Towels' },
        { field: 'companyId', from: null, to: 'company-1' },
      ],
    } as const;

    mockUseList
      .mockImplementationOnce(() => ({
        data: { data: [auditEntry] },
        isLoading: false,
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: {
          data: [
            {
              id: 'deal-1',
              title: 'Oriental Bronze Towels',
              stage: { id: 'stage-1', title: 'Prospecting' },
              company: {
                id: 'company-1',
                name: 'Terry, Kshlerin and Witting',
                avatarUrl: 'https://example.com/logo.png',
              },
              createdAt: '2024-07-15T10:30:00.000Z',
            },
          ],
        },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: {
          data: [
            {
              id: 'company-1',
              name: 'Terry, Kshlerin and Witting',
              avatarUrl: 'https://example.com/logo.png',
            },
          ],
        },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }));

    mockUseSelect.mockReturnValue({
      queryResult: {
        data: { data: [] },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      },
    });

    render(<LatestActivities />);

    expect(screen.getByText('James Coffey')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('Oriental Bronze Towels')).toBeInTheDocument();
    expect(screen.getByText('Terry, Kshlerin and Witting')).toBeInTheDocument();
  });

  it('uses audit change values for non-deal subjects', () => {
    const auditEntry = {
      ...baseAudit,
      action: 'UPDATE',
      targetEntity: 'Contact',
      targetId: 'contact-1',
      changes: [{ field: 'name', from: 'Old Name', to: 'Alice Johnson' }],
    } as const;

    mockUseList
      .mockImplementationOnce(() => ({
        data: { data: [auditEntry] },
        isLoading: false,
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }));

    mockUseSelect.mockReturnValue({
      queryResult: {
        data: { data: [] },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      },
    });

    render(<LatestActivities />);

    expect(screen.getByText('updated')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('returns null when audits fail', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const auditError = new Error('audits failed');

    mockUseList
      .mockImplementationOnce(() => ({
        data: undefined,
        isLoading: false,
        isError: true,
        error: auditError,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }))
      .mockImplementationOnce(() => ({
        data: { data: [] },
        isError: false,
        error: null,
        refetch: noopRefetch,
      }));

    const { container } = render(<LatestActivities />);

    expect(container).toBeEmptyDOMElement();
    expect(errorSpy).toHaveBeenCalledWith('LatestActivities failed to load audits', {
      auditsError: auditError,
    });

    errorSpy.mockRestore();
  });
});
