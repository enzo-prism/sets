import { test, expect } from "@playwright/test"

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

const viewports = [
  { name: "mobile", size: { width: 390, height: 844 } },
  { name: "tablet", size: { width: 834, height: 1112 } },
  { name: "desktop", size: { width: 1280, height: 800 } },
]

for (const viewport of viewports) {
  test(`edit sheet layout is responsive on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport.size)
    await page.addInitScript((set) => {
      window.localStorage.setItem("sets-tracker:v1", JSON.stringify([set]))
      window.localStorage.setItem("sets-tracker:device-id", "test-device")
    }, seedSet)

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
  await page.addInitScript((set) => {
    window.localStorage.setItem("sets-tracker:v1", JSON.stringify([set]))
    window.localStorage.setItem("sets-tracker:device-id", "test-device")
  }, seedSet)

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
