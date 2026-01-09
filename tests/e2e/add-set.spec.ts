import { test, expect } from "@playwright/test"

test("can add a set on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    window.localStorage.setItem("sets-tracker:v1", "[]")
    window.localStorage.setItem("sets-tracker:device-id", "test-device")
  })

  await page.goto("/")

  await page.getByRole("button", { name: /add your first set/i }).click()
  await expect(
    page.getByRole("heading", { name: /log a set/i })
  ).toBeVisible()

  const submitButton = page.getByRole("button", { name: /add set/i })
  await submitButton.scrollIntoViewIfNeeded()
  await expect(submitButton).toBeVisible()
  await submitButton.click()

  await expect(
    page.getByRole("heading", { name: /log a set/i })
  ).toBeHidden()
  await expect(page.getByText("No sets yet")).toBeHidden()
  await expect(page.getByText("Untitled set")).toBeVisible()
})
