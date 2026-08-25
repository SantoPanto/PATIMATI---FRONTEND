import { request } from "./api";
import type {
  PotentialMatchDecision,
  PotentialMatchSummaryResponse,
} from "./types";

/**
 * 7. Olası Eşleşmeler (/api/me/potential-matches)
 *
 * Bu uçlar hem native (ilan <-> ilan) hem de Instagram kaynaklı
 * (ilan <-> external kayıt) olası eşleşmeleri aynı şekilde döner —
 * hangisi olduğu counterparty.kind alanından anlaşılır.
 */

export function getMyPotentialMatches(): Promise<
  PotentialMatchSummaryResponse[]
> {
  return request<PotentialMatchSummaryResponse[]>(
    "/api/me/potential-matches",
    {
      method: "GET",
      requiresAuth: true,
    },
  );
}

export function decideOnMatch(
  recipientId: number,
  decision: PotentialMatchDecision,
): Promise<PotentialMatchSummaryResponse> {
  return request<PotentialMatchSummaryResponse>(
    `/api/me/potential-matches/${recipientId}/decision`,
    {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({ decision }),
    },
  );
}
