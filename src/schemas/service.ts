import { z } from "zod";

// Data contract for POST /api/services.
// .strict() rejects any unrecognized keys (e.g. status, provider_id).
export const serviceCreateSchema = z
  .object({
    title: z.string().min(5),
    hourly_rate: z.number().nonnegative(),
    duration_minutes: z.number().int().min(15),
    coverage_radius_miles: z.number().int().positive(),
  })
  .strict();

export type ServiceCreate = z.infer<typeof serviceCreateSchema>;
