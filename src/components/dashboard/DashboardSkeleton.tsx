export function DashboardSkeleton() {
    return (
        <div className="dashboard-skeleton">
            {/* StatGrid skeleton */}
            <div className="stat-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="stat-card skeleton-card">
                        <div className="skeleton-circle" />
                        <div className="skeleton-info">
                            <div className="skeleton-line skeleton-sm" />
                            <div className="skeleton-line skeleton-lg" />
                        </div>
                    </div>
                ))}
            </div>

            {/* SafetyMarginCard skeleton */}
            <div className="card skeleton-card" style={{ marginBottom: 24, padding: 24 }}>
                <div className="skeleton-line skeleton-sm" style={{ width: '40%', marginBottom: 16 }} />
                <div className="skeleton-line skeleton-xl" style={{ width: '50%', margin: '0 auto 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <div className="skeleton-line skeleton-sm" style={{ width: 140 }} />
                    <div className="skeleton-line skeleton-sm" style={{ width: 140 }} />
                </div>
                <div className="skeleton-bar" style={{ marginTop: 20 }} />
            </div>

            {/* FixedExpenses skeleton */}
            <div className="card skeleton-card" style={{ marginBottom: 24 }}>
                <div className="skeleton-line skeleton-md" style={{ width: '45%', marginBottom: 20 }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div className="skeleton-line skeleton-sm" style={{ width: '30%' }} />
                            <div className="skeleton-line skeleton-sm" style={{ width: '20%' }} />
                        </div>
                        <div className="skeleton-bar" />
                    </div>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="charts-grid">
                <div className="card skeleton-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="skeleton-line skeleton-md" style={{ width: '30%', marginBottom: 24 }} />
                    <div className="skeleton-chart" />
                </div>
                <div className="card skeleton-card">
                    <div className="skeleton-line skeleton-md" style={{ width: '50%', marginBottom: 24 }} />
                    <div className="skeleton-chart-circle" />
                </div>
                <div className="card skeleton-card">
                    <div className="skeleton-line skeleton-md" style={{ width: '50%', marginBottom: 24 }} />
                    <div className="skeleton-chart" />
                </div>
            </div>
        </div>
    );
}
