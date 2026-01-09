import { test, expect, type Page } from "@playwright/test"

const mobileViewport = { width: 390, height: 844 }

async function openLogSetDialog(page: Page) {
  await page.setViewportSize(mobileViewport)
  await page.addInitScript(() => {
    window.localStorage.setItem("sets-tracker:v1", "[]")
    window.localStorage.setItem("sets-tracker:device-id", "test-device")
  })

  await page.goto("/")
  await page.getByRole("button", { name: /add your first set/i }).click()
  await expect(
    page.getByRole("heading", { name: /log a set/i })
  ).toBeVisible()
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

  await expect(
    page.getByRole("heading", { name: /log a set/i })
  ).toBeHidden()
  await expect(page.getByText("No sets yet")).toBeHidden()
  await expect(page.getByText("Untitled set")).toBeVisible()
})
