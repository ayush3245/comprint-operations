export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-10 w-32 bg-muted rounded" />
            </div>

            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="p-4 rounded-xl bg-card border border-border"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-muted" />
                            <div className="h-3 w-20 bg-muted rounded" />
                        </div>
                        <div className="h-8 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="h-5 w-40 bg-muted rounded mb-6" />
                    <div className="h-64 bg-muted rounded" />
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="h-5 w-40 bg-muted rounded mb-6" />
                    <div className="h-64 bg-muted rounded" />
                </div>
            </div>

            {/* Bottom section skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="p-6 rounded-xl bg-card border border-border"
                    >
                        <div className="h-5 w-32 bg-muted rounded mb-4" />
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="h-4 bg-muted rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
