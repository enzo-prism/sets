import { Suspense } from "react"
import { HomeView } from "@/components/home-view"

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-24" />}>
      <HomeView />
    </Suspense>
  )
}
