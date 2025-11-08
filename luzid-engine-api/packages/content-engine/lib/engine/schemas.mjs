import { z } from "zod";

export const BasePayload = z.object({
  type: z.string().min(1),
  creator: z.string().min(1),
  user: z.string().optional(),
  week: z.string().optional(),
  event: z.string().optional(),
  length: z.enum(["short","medium","long"]).default("medium"),
  persona: z.string().optional(),
  age: z.number().int().min(10).max(99).optional(),
});

export const WeeklyPayload = BasePayload.extend({
  type: z.literal("weekly"),
  week: z.string().min(4),
});

export const MicroPayload = BasePayload.extend({
  type: z.literal("micro"),
});

export function parsePayload(obj) {
  if (obj?.type === "weekly") return WeeklyPayload.parse(obj);
  if (obj?.type === "micro")  return MicroPayload.parse(obj);
  return BasePayload.parse(obj);
}

