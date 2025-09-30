import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { useCompanyContacts } from "../use-company-contacts";
import { useCreate, useDelete, useSubscription, useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/antd";

vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    useCreate: vi.fn(),
    useUpdate: vi.fn(),
    useDelete: vi.fn(),
    useSubscription: vi.fn(),
  };
});

vi.mock("@refinedev/antd", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/antd")>("@refinedev/antd");

  return {
    ...actual,
    useTable: vi.fn(),
  };
});

const mockUseTable = useTable as unknown as Mock;
const mockUseCreate = useCreate as unknown as Mock;
const mockUseUpdate = useUpdate as unknown as Mock;
const mockUseDelete = useDelete as unknown as Mock;
const mockUseSubscription = useSubscription as unknown as Mock;

describe("useCompanyContacts", () => {
  const baseContact = {
    id: "1",
    name: "Pam Beesly",
    avatarUrl: null,
    jobTitle: "Office Administrator",
    email: "pam@dundermifflin.com",
    phone: "+1 555 0000",
    status: "NEW",
    salesOwner: {
      id: "10",
      name: "Michael Scott",
      avatarUrl: null,
    },
  } as const;

  const refetchMock = vi.fn().mockResolvedValue({});
  const createMutateMock = vi.fn().mockResolvedValue({});
  const updateMutateMock = vi.fn().mockResolvedValue({});
  const deleteMutateMock = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    mockUseTable.mockReturnValue({
      tableProps: {
        dataSource: [baseContact],
        pagination: { total: 1 },
        loading: false,
      },
      tableQueryResult: {
        data: { data: [baseContact] },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: refetchMock,
      },
    });

    mockUseCreate.mockReturnValue({ mutateAsync: createMutateMock, isLoading: false });
    mockUseUpdate.mockReturnValue({ mutateAsync: updateMutateMock, isLoading: false });
    mockUseDelete.mockReturnValue({ mutateAsync: deleteMutateMock, isLoading: false });
    mockUseSubscription.mockReturnValue(undefined);
    refetchMock.mockClear();
    createMutateMock.mockClear();
    updateMutateMock.mockClear();
    deleteMutateMock.mockClear();
  });

  it("returns contacts from the table data", () => {
    const { result } = renderHook(() => useCompanyContacts("1"));

    expect(result.current.contacts).toEqual([baseContact]);
  });

  it("creates a contact and refetches the table", async () => {
    const { result } = renderHook(() => useCompanyContacts("1"));

    await act(async () => {
      await result.current.createContact({
        name: "Jim Halpert",
        email: "jim@dundermifflin.com",
        jobTitle: "Sales",
        phone: "+1 555 1111",
        status: "NEW",
        salesOwnerId: "10",
        salesOwner: baseContact.salesOwner,
      });
    });

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "contacts",
        values: expect.objectContaining({
          name: "Jim Halpert",
          email: "jim@dundermifflin.com",
          companyId: "1",
        }),
      }),
    );
    expect(refetchMock).toHaveBeenCalled();
  });

  it("updates and deletes contacts via the respective mutations", async () => {
    const { result } = renderHook(() => useCompanyContacts("1"));

    await act(async () => {
      await result.current.updateContact("1", {
        name: "Pam Beesly",
        email: "pam@dundermifflin.com",
        jobTitle: "Office Administrator",
        phone: "+1 555 0000",
        status: "QUALIFIED",
        salesOwnerId: "10",
        salesOwner: baseContact.salesOwner,
      });
    });

    expect(updateMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "contacts",
        id: "1",
      }),
    );

    await act(async () => {
      await result.current.deleteContact("1");
    });

    expect(deleteMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "contacts",
        id: "1",
      }),
    );
  });
});
