import { schedulePost, unschedulePost } from "@/services/postSchedule";
import { asString, readJsonOrEmpty } from "@/server/http/body";
import { HttpError, badRequest } from "@/server/http/errors";
import { route } from "@/server/http/route";

type Params = { id: string };

export const POST = route<"tenant", Params>({ auth: "tenant", failure: "Failed to schedule the post" }, async ({ clientId, params, request }) => {
  const body = await readJsonOrEmpty(request);
  const date = asString(body.date);
  const time = asString(body.time);
  if (!date || !time) throw badRequest("date (YYYY-MM-DD) and time (HH:mm) are required");

  const result = await schedulePost(clientId, params.id, date, time);
  if (!result.ok) throw new HttpError(result.status, result.error);
  return { success: true, status: result.status, scheduled_for: result.scheduled_for };
});

export const DELETE = route<"tenant", Params>({ auth: "tenant", failure: "Failed to cancel the schedule" }, async ({ clientId, params }) => {
  const result = await unschedulePost(clientId, params.id);
  if (!result.ok) throw new HttpError(result.status, result.error);
  return { success: true, status: result.status, scheduled_for: null };
});
