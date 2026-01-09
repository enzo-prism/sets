import { test, expect, type Page } from "@playwright/test"

type LoggedSet = {
  id: string
  workoutType?: string | null
  weightLb?: number | null
  reps?: number | null
  restSeconds?: number | null
  performedAtISO?: string | null
  createdAtISO: string
  updatedAtISO: string
}

const mobileViewport = { width: 390, height: 844 }

async function mockSetsApi(page: Page) {
  const sets: LoggedSet[] = []

  await page.route("**/api/sets", async (route) => {
    const method = route.request().method()

    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        json: sets,
      })
    }

    if (method === "POST") {
      const payload = route.request().postDataJSON() as Omit<
        LoggedSet,
        "id" | "createdAtISO" | "updatedAtISO"
      >
      const nowIso = new Date().toISOString()
      const created: LoggedSet = {
        id: `set-${sets.length + 1}`,
        workoutType: payload.workoutType ?? null,
        weightLb: payload.weightLb ?? null,
        reps: payload.reps ?? null,
        restSeconds: payload.restSeconds ?? null,
        performedAtISO: payload.performedAtISO ?? null,
        createdAtISO: nowIso,
        updatedAtISO: nowIso,
      }
      sets.unshift(created)
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        json: created,
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

async function openLogSetDialog(page: Page) {
  await page.setViewportSize(mobileViewport)
  await mockSetsApi(page)

  await page.goto("/")
  await page.getByRole("button", { name: /add your first set/i }).click()
  await expect(page.getByTestId("log-set-dialog")).toBeVisible()
}

test("log set dialog stays within the mobile viewport", async ({ page }) => {
  await openLogSetDialog(page)

  const dialog = page.getByTestId("log-set-dialog")
  await expect(dialog).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  if (dialogBox) {
    expect(dialogBox.x).toBeGreaterThanOrEqual(0)
    expect(dialogBox.y).toBeGreaterThanOrEqual(0)
    expect(dialogBox.width).toBeLessThanOrEqual(mobileViewport.width + 1)
    expect(dialogBox.height).toBeLessThanOrEqual(mobileViewport.height + 1)
  }

  const submitButton = page.getByRole("button", { name: /add set/i })
  const isSubmitVisible = await submitButton.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight + 1
  })
  expect(isSubmitVisible).toBe(true)

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(hasOverflow).toBe(false)
})

test("log set footer stays visible while scrolling", async ({ page }) => {
  await openLogSetDialog(page)

  const scrollArea = page.getByTestId("log-set-body")
  await scrollArea.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })

  const submitButton = page.getByRole("button", { name: /add set/i })
  const isSubmitVisible = await submitButton.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= window.innerHeight + 1
  })
  expect(isSubmitVisible).toBe(true)
})

test("can add a set on mobile", async ({ page }) => {
  await openLogSetDialog(page)

  const submitButton = page.getByRole("button", { name: /add set/i })
  await submitButton.click()

  await expect(page.getByTestId("log-set-dialog")).toBeHidden()
  await expect(page.getByText("No sets yet")).toBeHidden()
  await expect(page.getByText("Untitled set")).toBeVisible()
})

test("shows an error when the api fails", async ({ page }) => {
  await page.setViewportSize(mobileViewport)
  await page.route("**/api/sets", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        json: { error: "Supabase is not configured." },
      })
    }
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      json: { error: "Supabase is not configured." },
    })
  })

  await page.goto("/")
  const alert = page.getByTestId("data-error")
  await expect(alert).toBeVisible()
  await expect(alert).toHaveText(/supabase is not configured/i)
})
