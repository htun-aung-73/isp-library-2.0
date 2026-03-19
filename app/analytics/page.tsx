import { AnalyticsCharts } from "@/components/analytics-charts"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Library Analytics</h1>
        <p className="text-muted-foreground text-base">Visualizing our collection growth and diversity</p>
      </div>

      <AnalyticsCharts />
    </div>
  )
}

