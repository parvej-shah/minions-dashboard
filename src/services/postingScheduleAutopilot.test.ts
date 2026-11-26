import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduleFind = vi.fn();
const scheduleUpsert = vi.fn();
const getLinkedInHealth = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { postingSchedule: { findUnique: scheduleFind, upsert: scheduleUpsert } } }));
vi.mock("@/services/linkedinHealth", () => ({ getLinkedInHealth }));
vi.mock("@/services/onboardingGuard", () => ({ assertNotEstablished: vi.fn() }));

const { saveScheduleSettings } = await import("./postingSchedule");

const body = (requireReview: boolean) => ({ cadence_type: "DAILY", days_of_week: [], posts_per_day: 1, times_of_day: ["09:00"], require_review: requireReview, is_active: true });
const saved = { cadenceType: "DAILY", intervalDays: null, daysOfWeek: [], postsPerDay: 1, timesOfDay: ["09:00"], requireReview: false, isActive: true, createdAt: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
  scheduleFind.mockResolvedValue({ requireReview: true });
  scheduleUpsert.mockResolvedValue(saved);
});

describe("turning Autopilot on", () => {
  it("refuses with a reason when LinkedIn is missing or expired", async () => {
    for (const health of ["missing", "expired"]) {
      getLinkedInHealth.mockResolvedValue(health);
      await expect(saveScheduleSettings("c1", body(false))).rejects.toThrow(/Connect LinkedIn first/);
    }
    expect(scheduleUpsert).not.toHaveBeenCalled();
  });

  it("allows it on a working connection", async () => {
    getLinkedInHealth.mockResolvedValue("connected");
    await saveScheduleSettings("c1", body(false));
    expect(scheduleUpsert).toHaveBeenCalled();
  });

  it("always allows Review first, and leaves an Autopilot already on alone", async () => {
    getLinkedInHealth.mockResolvedValue("missing");
    await saveScheduleSettings("c1", body(true));
    scheduleFind.mockResolvedValue({ requireReview: false });
    await saveScheduleSettings("c1", body(false));
    expect(scheduleUpsert).toHaveBeenCalledTimes(2);
  });
});

describe("saving a publishing pace (task 129)", () => {
  it("turns automatic drafting on: there is no separate switch any more", async () => {
    getLinkedInHealth.mockResolvedValue("connected");
    await saveScheduleSettings("c1", body(true));
    expect(scheduleUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ fillerEnabled: true }),
        create: expect.objectContaining({ fillerEnabled: true }),
      }),
    );
  });
});
