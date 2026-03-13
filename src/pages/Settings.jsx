import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', 
      background: '#F8FAFC', overflow: 'hidden' 
    }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'white',
        borderRight: '1px solid #E2E8F0', display: 'flex',
        flexDirection: 'column', height: '100vh',
        position: 'fixed', top: 0, left: 0, zIndex: 20
      }}>
        {/* Logo area */}
        <div style={{ padding: 24, borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Prime</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0EA5A0' }}>Talk</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {[
            { icon: '🏠', label: 'Dashboard' },
            { icon: '🔍', label: 'Browse Teachers' },
            { icon: '📅', label: 'My Lessons' },
            { icon: '📚', label: 'Textbooks' },
            { icon: '💬', label: 'Messages' },
            { icon: '⚙️', label: 'Settings', active: true }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px', cursor: 'pointer', fontSize: 14,
                fontWeight: 500, color: item.active ? '#0EA5A0' : '#64748B', 
                transition: 'all 0.15s',
                borderLeft: item.active ? '3px solid #0EA5A0' : '3px solid transparent'
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: '#0EA5A0',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 700
            }}>
              AJ
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Alex Johnson</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Student</div>
            </div>
            <button 
              onClick={() => navigate("/login")}
              style={{
                marginLeft: 'auto', background: 'transparent', border: '1px solid #E2E8F0',
                padding: '8px', borderRadius: 8, color: '#64748B', fontSize: 13, cursor: 'pointer'
              }}
            >
              🔒
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* HEADER */}
        <header style={{
          height: 64, background: 'white', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Settings</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>🔔</button>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: '#0EA5A0',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 700
            }}>
              AJ
            </div>
          </div>
        </header>

        {/* MAIN SCROLL AREA */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
            {['profile', 'notifications', 'privacy', 'billing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #0EA5A0' : '2px solid transparent',
                  color: activeTab === tab ? '#0EA5A0' : '#64748B'
                }}
              >
                {tab === 'profile' && 'Profile'}
                {tab === 'notifications' && 'Notifications'}
                {tab === 'privacy' && 'Privacy'}
                {tab === 'billing' && 'Billing'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Profile Settings</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: '#64748B' }}>Full Name</label>
                    <input 
                      defaultValue="Alex Johnson"
                      style={{
                        padding: '12px', border: '1px solid #E2E8F0', borderRadius: 8,
                        fontSize: 14, color: '#0F172A'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: '#64748B' }}>Email</label>
                    <input 
                      defaultValue="alex@example.com"
                      style={{
                        padding: '12px', border: '1px solid #E2E8F0', borderRadius: 8,
                        fontSize: 14, color: '#0F172A'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: '#64748B' }}>Current Level</label>
                    <select 
                      defaultValue="B2 - Upper Intermediate"
                      style={{
                        padding: '12px', border: '1px solid #E2E8F0', borderRadius: 8,
                        fontSize: 14, color: '#0F172A'
                      }}
                    >
                      <option>B1 - Intermediate</option>
                      <option>B2 - Upper Intermediate</option>
                      <option>C1 - Advanced</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: '#64748B' }}>Preferred Language</label>
                    <select 
                      defaultValue="English"
                      style={{
                        padding: '12px', border: '1px solid #E2E8F0', borderRadius: 8,
                        fontSize: 14, color: '#0F172A'
                      }}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    padding: '12px 24px', background: '#0EA5A0', color: 'white',
                    borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}>
                    Save Changes
                  </button>
                  <button style={{
                    padding: '12px 24px', background: 'transparent', color: '#64748B',
                    borderRadius: 10, fontWeight: 600, border: '1px solid #E2E8F0', cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Notification Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Email notifications', description: 'Receive email updates about your lessons and progress' },
                    { label: 'Push notifications', description: 'Get push notifications on your devices' },
                    { label: 'Lesson reminders', description: 'Get reminders 1 hour before your lessons' },
                    { label: 'Promotional emails', description: 'Receive special offers and updates' }
                  ].map((setting, index) => (
                    <div key={index} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{setting.label}</div>
                        <div style={{ fontSize: 13, color: '#64748B' }}>{setting.description}</div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                        <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: '#0EA5A0', borderRadius: 24, transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute', content: '', height: 16, width: 16, left: 4, bottom: 4,
                            backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Privacy Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Profile Visibility</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Control who can see your profile information</div>
                    <select 
                      defaultValue="Teachers Only"
                      style={{
                      padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: 13, color: '#0F172A'
                    }}>
                      <option>Public</option>
                      <option>Teachers Only</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Data Export</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Download all your data from PrimeTalk</div>
                    <button style={{
                      padding: '8px 16px', background: '#0EA5A0', color: 'white',
                      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                    }}>
                      Export Data
                    </button>
                  </div>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Delete Account</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Permanently delete your account and all associated data</div>
                    <button style={{
                      padding: '8px 16px', background: '#EF4444', color: 'white',
                      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                    }}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Billing & Subscriptions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Current Plan</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Premium Student Plan</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>$19.99 / month</div>
                  </div>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Payment Method</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Visa ending in 1234</div>
                    <button style={{
                      padding: '8px 16px', background: '#0EA5A0', color: 'white',
                      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                    }}>
                      Update Payment
                    </button>
                  </div>
                  <div style={{
                    padding: '16px', border: '1px solid #E2E8F0', borderRadius: 12
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Billing History</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>View your past invoices and receipts</div>
                    <button style={{
                      padding: '8px 16px', background: 'transparent', color: '#0EA5A0',
                      borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13
                    }}>
                      View History
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Settings