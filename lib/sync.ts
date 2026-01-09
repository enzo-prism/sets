import type { LoggedSet } from "@/lib/types"

export function mergeSets(localSets: LoggedSet[], remoteSets: LoggedSet[]) {
  const merged = new Map<string, LoggedSet>()

  for (const set of localSets) {
    merged.set(set.id, set)
  }

  for (const set of remoteSets) {
    const existing = merged.get(set.id)
    if (!existing) {
      merged.set(set.id, set)
      continue
    }
    const existingUpdated = existing.updatedAtISO || existing.createdAtISO
    const incomingUpdated = set.updatedAtISO || set.createdAtISO
    if (incomingUpdated > existingUpdated) {
      merged.set(set.id, set)
    }
  }

  return Array.from(merged.values())
}
