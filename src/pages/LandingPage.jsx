import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [statsVisible, setStatsVisible] = useState(false)

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]))
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsVisible(true)
          }
        })
      },
      { threshold: 0.5 }
    )

    const statsEl = document.querySelector('[data-stats]')
    if (statsEl) observer.observe(statsEl)

    return () => observer.disconnect()
  }, [])

  const teachers = [
    {
      id: 1,
      name: 'Sarah K.',
      specialty: 'Business English',
      rating: 4.9,
      reviews: 312,
      status: 'online',
      price: 18,
      avatarColor: '#0EA5A0'
    },
    {
      id: 2,
      name: 'James O.',
      specialty: 'IELTS Preparation',
      rating: 4.8,
      reviews: 198,
      status: 'available',
      price: 22,
      avatarColor: '#0EA5A0'
    },
    {
      id: 3,
      name: 'Amina R.',
      specialty: 'Casual Conversation',
      rating: 5.0,
      reviews: 87,
      status: 'online',
      price: 15,
      avatarColor: '#0EA5A0'
    }
  ]

  const stats = [
    { label: 'Active Students', value: 2400 },
    { label: 'Certified Teachers', value: 85 },
    { label: 'Lessons Completed', value: 50000 },
    { label: 'Average Rating', value: 4.9 }
  ]

  const testimonials = [
    {
      quote: "I went from nervous to confident in just 3 weeks. My teacher was incredibly patient.",
      name: "Maria S.",
      flag: "🇧🇷",
      rating: 5
    },
    {
      quote: "Instant lessons are a game changer. I open the app and I'm talking to a teacher in minutes.",
      name: "Yusuf A.",
      flag: "🇳🇬",
      rating: 5
    },
    {
      quote: "Booked my IELTS prep sessions 2 weeks out. Scored 7.5 band. Highly recommend James!",
      name: "Chen L.",
      flag: "🇨🇳",
      rating: 5
    }
  ]

  const steps = [
    {
      icon: "🔍",
      title: "Find a Teacher",
      description: "Browse profiles, filter by availability and specialty"
    },
    {
      icon: "📅",
      title: "Book or Go Instant",
      description: "Schedule ahead or start a lesson right now"
    },
    {
      icon: "🎥",
      title: "Learn via Video",
      description: "Face-to-face HD lessons with chat and notes"
    }
  ]

  const CountingNumber = ({ target, duration = 2000 }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (!statsVisible) return

      let start = 0
      const increment = target / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }, [target, duration, statsVisible])

    return <span>{count.toLocaleString()}</span>
  }

  const StarRating = ({ rating, size = 'sm' }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{ fontSize: size === 'sm' ? 12 : 14 }}>
          {i < Math.floor(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 80px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Syne' }}>
            Prime
          </span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#0EA5A0', fontFamily: 'Syne' }}>
            Talk
          </span>
        </div>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" style={{
            color: '#334155', fontSize: 15, fontWeight: 500,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer'
          }}>
            Home
          </Link>
          <Link to="/browse" style={{
            color: '#334155', fontSize: 15, fontWeight: 500,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer'
          }}>
            Browse Teachers
          </Link>
          <Link to="/how-it-works" style={{
            color: '#334155', fontSize: 15, fontWeight: 500,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer'
          }}>
            How It Works
          </Link>
          <Link to="/pricing" style={{
            color: '#334155', fontSize: 15, fontWeight: 500,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer'
          }}>
            Pricing
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link 
            to="/login"
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1.5px solid #E2E8F0',
              background: 'transparent', color: '#0F172A', fontWeight: 600,
              fontSize: 14, cursor: 'pointer'
            }}
          >
            Log In
          </Link>
          <Link 
            to="/register"
            style={{
              background: '#0EA5A0', color: 'white', padding: '10px 20px',
              borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            display: 'none', padding: 8, background: 'transparent', border: 'none',
            cursor: 'pointer', position: 'relative', width: 24, height: 24
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{
              display: 'block', width: 20, height: 2, background: '#334155',
              marginBottom: 4, transition: 'all 0.3s'
            }}></span>
            <span style={{
              display: 'block', width: 20, height: 2, background: '#334155',
              marginBottom: 4, transition: 'all 0.3s'
            }}></span>
            <span style={{
              display: 'block', width: 20, height: 2, background: '#334155',
              transition: 'all 0.3s'
            }}></span>
          </div>
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        padding: '120px 80px 80px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background decorative circles */}
        <div style={{
          position: 'absolute', top: '-50%', right: '-50%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(14,165,160,0.3) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute', bottom: '-30%', left: '-30%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', zIndex: 0
        }}></div>

        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 48, zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Badge */}
            <div style={{
              background: 'rgba(14,165,160,0.15)', color: '#0EA5A0',
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              display: 'inline-flex', width: 'fit-content'
            }}>
              🌍 Trusted by 2,400+ students
            </div>

            {/* Headline */}
            <div>
              <h1 style={{
                fontSize: 64, fontWeight: 800, color: 'white', lineHeight: 1.1,
                marginBottom: 12
              }}>
                Learn English with Expert Tutors
              </h1>
              <h1 style={{
                fontSize: 64, fontWeight: 800, color: '#0EA5A0', lineHeight: 1.1
              }}>
                Anytime, Instantly.
              </h1>
            </div>

            {/* Subtitle */}
            <p style={{
              color: '#94A3B8', fontSize: 18, maxWidth: 520, lineHeight: 1.6,
              marginBottom: 40
            }}>
              Connect with certified teachers for instant sessions or book in advance. Real conversations. Real progress.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 16 }}>
              <Link 
                to="/browse"
                style={{
                  background: '#0EA5A0', color: 'white', padding: '14px 28px',
                  borderRadius: 8, fontSize: 16, fontWeight: 700, border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Start Instant Lesson →
              </Link>
              <Link 
                to="/browse"
                style={{
                  background: 'transparent', color: 'white', padding: '14px 28px',
                  borderRadius: 8, fontSize: 16, fontWeight: 700, border: '2px solid white',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Browse Teachers
              </Link>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: -8 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#0EA5A0',
                    border: '2px solid white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span style={{ color: '#94A3B8', fontSize: 14 }}>
                4.9/5 · from 2,400+ students
              </span>
            </div>
          </div>

          {/* Right side - Live stats card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32,
            display: 'flex', flexDirection: 'column', gap: 24, position: 'relative'
          }}>
            {/* Live Now badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></div>
              <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>Live Now</span>
            </div>

            {/* Teachers Online */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: 'white' }}>12</span>
              <span style={{ color: '#94A3B8', fontSize: 14 }}>Teachers Online</span>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', width: '100%' }}></div>

            {/* Next Available */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Next Available</div>
                <div style={{ color: '#0EA5A0', fontSize: 16, fontWeight: 700 }}>Sarah K. · 2 min</div>
              </div>
              <div>
                <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4 }}>Avg. Response</div>
                <div style={{ color: '#0EA5A0', fontSize: 16, fontWeight: 700 }}>30 sec</div>
              </div>
            </div>

            {/* 24/7 Availability */}
            <div style={{ textAlign: 'center', marginTop: 'auto', color: '#94A3B8', fontSize: 14 }}>
              24/7 Availability
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section 
        data-section="how-it-works"
        style={{ padding: '100px 80px', background: 'white' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            color: '#0EA5A0', fontSize: 12, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 16
          }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
            Three steps to fluency
          </h2>
          <p style={{ color: '#64748B', fontSize: 18 }}>
            Getting started is simple and fast
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {steps.map((step, index) => (
            <div 
              key={index}
              style={{
                background: '#F8FAFC', borderRadius: 16, padding: 32,
                border: '1px solid #E2E8F0', position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              {/* Step number */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#0EA5A0',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, marginBottom: 16
              }}>
                {index + 1}
              </div>
              
              {/* Icon */}
              <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
              
              {/* Title */}
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                {step.title}
              </h3>
              
              {/* Description */}
              <p style={{ color: '#64748B', lineHeight: 1.6 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Teachers Section */}
      <section 
        data-section="teachers"
        style={{ padding: '100px 80px', background: '#F8FAFC' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            color: '#0EA5A0', fontSize: 12, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 16
          }}>
            MEET OUR TEACHERS
          </div>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
            Meet some of our teachers
          </h2>
          <p style={{ color: '#64748B', fontSize: 18 }}>
            All our teachers are certified and experienced
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, marginBottom: 48 }}>
          {teachers.map((teacher, index) => (
            <div 
              key={teacher.id}
              style={{
                background: 'white', borderRadius: 20, padding: 28,
                border: '1px solid #E2E8F0', transition: 'all 0.2s'
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: teacher.avatarColor,
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, position: 'relative'
                  }}>
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                    <div style={{
                      position: 'absolute', top: -4, right: -4, width: 12, height: 12,
                      borderRadius: '50%', background: teacher.status === 'online' ? '#10B981' : '#F59E0B'
                    }}></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{teacher.name}</div>
                    <div style={{ fontSize: 14, color: '#64748B' }}>{teacher.specialty}</div>
                  </div>
                </div>
                <div style={{
                  background: '#F0FDFA', color: '#0EA5A0', padding: '4px 10px',
                  borderRadius: 999, fontSize: 13, fontWeight: 600
                }}>
                  ${teacher.price}/25min
                </div>
              </div>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarRating rating={teacher.rating} />
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{teacher.rating}</span>
                </div>
                <span style={{ color: '#64748B', fontSize: 13 }}>({teacher.reviews} reviews)</span>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{
                  background: teacher.status === 'online' ? '#DCFCE7' : '#FEF3C7',
                  color: teacher.status === 'online' ? '#16A34A' : '#D97706',
                  padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600
                }}>
                  {teacher.status === 'online' ? 'Online Now' : 'Available Today'}
                </span>
              </div>

              {/* Book Button */}
              <button style={{
                width: '100%', background: '#0EA5A0', color: 'white', padding: '12px',
                borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Book Session
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/browse"
            style={{
              color: '#0EA5A0', fontSize: 16, fontWeight: 600, cursor: 'pointer'
            }}
          >
            View all teachers →
          </Link>
        </div>
      </section>

      {/* Stats Banner */}
      <section 
        data-stats
        style={{
          padding: '80px', background: 'linear-gradient(135deg, #0F172A, #0EA5A0)',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32
        }}
      >
        {stats.map((stat, index) => (
          <div key={index} style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>
              {stat.value >= 1000 ? (
                <CountingNumber target={stat.value} />
              ) : (
                stat.value
              )}
              {stat.value >= 1000 && <span style={{ fontSize: 24 }}>+</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section 
        data-section="testimonials"
        style={{ padding: '100px 80px', background: 'white' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
            What students say
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              style={{
                background: 'white', borderRadius: 16, padding: 24,
                borderLeft: '4px solid #0EA5A0', border: '1px solid #E2E8F0',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#334155', lineHeight: 1.7, fontStyle: 'italic', fontSize: 16 }}>
                  "{testimonial.quote}"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{testimonial.name}</div>
                  <div style={{ color: '#64748B', fontSize: 14 }}>{testimonial.flag}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating rating={testimonial.rating} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '100px 80px', background: 'linear-gradient(135deg, #0EA5A0, #0C8F8A)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 48, fontWeight: 800, color: 'white', marginBottom: 16 }}>
          Ready to speak with confidence?
        </h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 40 }}>
          Join thousands of students improving their English every day.
        </p>
        
        <Link 
          to="/register"
          style={{
            display: 'inline-block', padding: '16px 32px', background: 'white',
            color: '#0EA5A0', borderRadius: 12, fontWeight: 800, fontSize: 18,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Get Started Free
        </Link>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 24 }}>
          No subscription required · Pay per session · Cancel anytime
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0F172A', padding: '60px 80px', color: '#94A3B8'
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 32, maxWidth: '1200px', margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'Syne' }}>
              Prime
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#0EA5A0', fontFamily: 'Syne' }}>
              Talk
            </span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, fontSize: 14 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/about" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>About</Link>
              <Link to="/careers" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Careers</Link>
              <Link to="/blog" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Blog</Link>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/privacy" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: '#94A3B8', transition: 'color 0.2s' }}>Terms</Link>
            </div>
          </div>

          <div style={{ fontSize: 14, color: '#64748B' }}>
            © 2025 PrimeTalk. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage