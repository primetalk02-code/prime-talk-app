const menuItems = [
  'Dashboard',
  'Reservations',
  'Schedule',
  'Lessons',
  'Lesson History',
  'Earnings',
  'Profile',
  'Settings',
]

const stats = [
  { label: 'Total Earnings', value: '$0' },
  { label: "Today’s Reservations", value: '0' },
  { label: 'Cancellations', value: '0' },
  { label: 'Incentives', value: '$0' },
]

export default function TeacherDashboard() {
  return (
    <div className="teacher-dashboard-layout">
      <aside className="teacher-sidebar">
        <div className="teacher-brand-block">
          <p className="teacher-brand">Prime Talk</p>
          <span className="teacher-role-chip">Teacher Panel</span>
        </div>

        <nav aria-label="Teacher dashboard navigation">
          <ul className="teacher-menu-list">
            {menuItems.map((item) => (
              <li key={item}>
                <button type="button" className={`teacher-menu-item ${item === 'Dashboard' ? 'active' : ''}`}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="teacher-main-content">
        <header className="teacher-main-header">
          <h1>Teacher Dashboard</h1>
          <p>Track your performance, lessons, and daily activity at a glance.</p>
        </header>

        <section className="teacher-stats-grid" aria-label="Teacher statistics">
          {stats.map((stat) => (
            <article key={stat.label} className="teacher-stat-card">
              <p className="teacher-stat-label">{stat.label}</p>
              <h2 className="teacher-stat-value">{stat.value}</h2>
            </article>
          ))}
        </section>
      </main>

      <style jsx>{`
        .teacher-dashboard-layout {
          min-height: 100vh;
          display: flex;
          background: #f6f8fc;
          color: #0f172a;
        }

        .teacher-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          padding: 24px 16px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
        }

        .teacher-brand-block {
          margin-bottom: 24px;
        }

        .teacher-brand {
          margin: 0 0 10px;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        .teacher-role-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .teacher-menu-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .teacher-menu-item {
          width: 100%;
          border: none;
          background: transparent;
          color: #334155;
          text-align: left;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .teacher-menu-item:hover {
          background: #f1f5f9;
        }

        .teacher-menu-item.active {
          background: #e0e7ff;
          color: #312e81;
        }

        .teacher-main-content {
          flex: 1;
          padding: 28px;
        }

        .teacher-main-header h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
        }

        .teacher-main-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .teacher-stats-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .teacher-stat-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 18px 16px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          border: 1px solid #edf2f7;
        }

        .teacher-stat-label {
          margin: 0;
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .teacher-stat-value {
          margin: 10px 0 0;
          font-size: 1.5rem;
          line-height: 1.2;
          color: #111827;
          font-weight: 800;
        }

        @media (max-width: 1100px) {
          .teacher-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .teacher-dashboard-layout {
            flex-direction: column;
          }

          .teacher-sidebar {
            width: 100%;
            border-right: 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .teacher-menu-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .teacher-main-content {
            padding: 20px;
          }
        }

        @media (max-width: 560px) {
          .teacher-menu-list {
            grid-template-columns: 1fr;
          }

          .teacher-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
