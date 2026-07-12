// lib/validations/review.ts

import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  comment: z.string().max(1000).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;