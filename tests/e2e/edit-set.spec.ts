import { test, expect, type Page } from "@playwright/test"

const seedSet = {
  id: "test-set-1",
  workoutType: "pull up",
  weightLb: 0,
  reps: 10,
  restSeconds: 90,
  performedAtISO: "2026-01-08T20:35:00.000Z",
  createdAtISO: "2026-01-08T20:00:00.000Z",
  updatedAtISO: "2026-01-08T20:00:00.000Z",
}

type LoggedSet = typeof seedSet

async function mockSetsApi(page: Page, initialSets: LoggedSet[]) {
  const sets = [...initialSets]

  await page.route("**/api/sets", async (route) => {
    const method = route.request().method()

    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        json: sets,
      })
    }

    if (method === "PATCH") {
      const payload = route.request().postDataJSON() as Partial<LoggedSet> & {
        id: string
      }
      const index = sets.findIndex((set) => set.id === payload.id)
      if (index === -1) {
        return route.fulfill({
          status: 404,
          contentType: "application/json",
          json: { error: "Set not found." },
        })
      }

      const updated = {
        ...sets[index],
        workoutType: payload.workoutType ?? null,
        weightLb: payload.weightLb ?? null,
        reps: payload.reps ?? null,
        restSeconds: payload.restSeconds ?? null,
        performedAtISO: payload.performedAtISO ?? null,
        updatedAtISO: new Date().toISOString(),
      }
      sets[index] = updated
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        json: updated,
      })
    }

    if (method === "DELETE") {
      const payload = route.request().postDataJSON() as { id: string }
      const index = sets.findIndex((set) => set.id === payload.id)
      if (index !== -1) {
        sets.splice(index, 1)
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { ok: true },
      })
    }

    return route.fulfill({
      status: 405,
      contentType: "application/json",
      json: { error: "Method not allowed" },
    })
  })

  return sets
}

const viewports = [
  { name: "mobile", size: { width: 390, height: 844 } },
  { name: "tablet", size: { width: 834, height: 1112 } },
  { name: "desktop", size: { width: 1280, height: 800 } },
]

for (const viewport of viewports) {
  test(`edit sheet layout is responsive on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await mockSetsApi(page, [seedSet])

    await page.goto(`/?edit=${seedSet.id}`)

    const sheet = page.getByTestId("edit-sheet")
    await expect(sheet).toBeVisible()

    await expect(page.getByTestId("workout-section")).toBeVisible()
    await expect(page.getByTestId("stats-section")).toBeVisible()
    await expect(page.getByTestId("time-section")).toBeVisible()

    const updateButton = page.getByRole("button", { name: /update set/i })
    await updateButton.scrollIntoViewIfNeeded()
    await expect(updateButton).toBeVisible()

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(hasOverflow).toBe(false)

    const box = await updateButton.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.size.width + 1)
    }
  })
}

test("can update a set on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockSetsApi(page, [seedSet])

  await page.goto("/")

  await page.getByRole("button", { name: /pull up/i }).click()
  await expect(page.getByTestId("edit-sheet")).toBeVisible()

  const repsInput = page.getByLabel("Reps")
  await repsInput.scrollIntoViewIfNeeded()
  await repsInput.fill("12")

  const updateButton = page.getByRole("button", { name: /update set/i })
  await updateButton.scrollIntoViewIfNeeded()
  await updateButton.click()

  await expect(page.getByTestId("edit-sheet")).toBeHidden()
  await expect(page.getByText("12 reps")).toBeVisible()
})
