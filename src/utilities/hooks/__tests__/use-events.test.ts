import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { useEvents } from "../use-events";
import {
  useCreate,
  useDelete,
  useList,
  useSubscription,
  useUpdate,
} from "@refinedev/core";

vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    useList: vi.fn(),
    useCreate: vi.fn(),
    useUpdate: vi.fn(),
    useDelete: vi.fn(),
    useSubscription: vi.fn(),
  };
});

const mockUseList = useList as unknown as Mock;
const mockUseCreate = useCreate as unknown as Mock;
const mockUseUpdate = useUpdate as unknown as Mock;
const mockUseDelete = useDelete as unknown as Mock;
const mockUseSubscription = useSubscription as unknown as Mock;

describe("useEvents", () => {
  const baseEvent = {
    id: "1",
    title: "Quarterly planning",
    color: "#1677ff",
    startDate: "2024-01-01T09:00:00.000Z",
    endDate: "2024-01-01T10:00:00.000Z",
  } as const;

  const refetchMock = vi.fn().mockResolvedValue({});
  const createMutateMock = vi.fn().mockResolvedValue({});
  const updateMutateMock = vi.fn().mockResolvedValue({});
  const deleteMutateMock = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    mockUseList.mockReturnValue({
      data: { data: [baseEvent] },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: refetchMock,
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

  it("creates an event and refetches the list", async () => {
    const { result } = renderHook(() => useEvents({ limit: 5 }));

    await act(async () => {
      await result.current.createEvent({
        title: "Team sync",
        startDate: "2024-02-01T09:00:00.000Z",
        endDate: "2024-02-01T10:00:00.000Z",
        color: "#ff0000",
        categoryId: "category-1",
        participantIds: [],
      });
    });

    expect(createMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "events",
        values: expect.objectContaining({ title: "Team sync", categoryId: "category-1" }),
      }),
    );
    expect(refetchMock).toHaveBeenCalled();
  });

  it("updates and deletes events", async () => {
    const { result } = renderHook(() => useEvents({ limit: 5 }));

    await act(async () => {
      await result.current.updateEvent("1", {
        title: "Updated event",
        startDate: baseEvent.startDate,
        endDate: baseEvent.endDate,
        color: baseEvent.color,
      });
    });

    expect(updateMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "events", id: "1" }),
    );

    await act(async () => {
      await result.current.deleteEvent("1");
    });

    expect(deleteMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "events", id: "1" }),
    );
  });
});
