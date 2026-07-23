import type { ServerResponse } from "node:http";
import type { ApiRequest } from "../server/http.js";
import { pushWeeklyReminders } from "../server/pushWeeklyReminders.js";

export default async function handler(req: ApiRequest, res: ServerResponse) {
  await pushWeeklyReminders(req, res);
}
