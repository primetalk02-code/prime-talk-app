import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!fullName.trim()) throw new Error("Full name is required");
      if (!email.trim()) throw new Error("Email is required");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");

      // Register user with Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      const user = signUpData.user;
      if (!user?.id) throw new Error("User registration failed");

      // Prevent duplicate profile creation
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profileExists) {
        await supabase
          .from("profiles")
          .insert({ id: user.id, email, role });
      }
      if (role === "student") {
        await supabase
          .from("student_profiles")
          .insert({ user_id: user.id });
      } else if (role === "teacher") {
        await supabase
          .from("teacher_applications")
          .insert({ user_id: user.id, status: "pending" });
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(role === "teacher" ? "/apply-teacher" : "/student/dashboard", {
          state: { user, message: "Registration successful!" },
        });
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    display: 'flex', minHeight: '100vh', width: '100%'
  }

  const leftStyle = {
    width: isMobile ? '100%' : '55%', background: 'linear-gradient(135deg, #0F172A 0%, #0EA5A0 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: isMobile ? '24px' : '48px'
  }

  const rightStyle = {
    flex: 1, background: 'white', display: isMobile ? 'none' : 'flex', 
    alignItems: 'center', justifyContent: 'center', padding: '48px'
  }

  return (
    <div style={pageStyle}>
      {/* LEFT PANEL */}
      <div style={leftStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'Syne' }}>
            Prime
          </span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#99f6e4', fontFamily: 'Syne' }}>
            Talk
          </span>
        </div>
        
        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 24, fontFamily: 'Syne' }}>
            Start your English journey today
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Instant lessons with certified teachers',
              'Schedule sessions around your life', 
              'Track your progress every step'
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: 'white', fontSize: 16
              }}>
                <span style={{ color: '#0EA5A0', fontSize: 20 }}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: -8 }}>
            {['A','B','C','D','E'].map((letter, index) => (
              <div key={index} style={{
                width: 32, height: 32, borderRadius: '50%', background: '#0EA5A0',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, fontWeight: 700,
                border: '2px solid white'
              }}>
                {letter}
              </div>
            ))}
          </div>
          <span style={{ color: 'white', fontSize: 14 }}>
            Join 2,400+ students
          </span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={rightStyle}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          
          {/* Role tabs */}
          <div style={{
            display: isMobile ? 'grid' : 'flex', background: '#F1F5F9', borderRadius: 10,
            padding: 4, marginBottom: 24, gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto'
          }}>
            <button 
              onClick={() => setRole('student')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                ...(role === 'student' 
                  ? { background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#0F172A', fontWeight: 600 }
                  : { color: '#64748B', background: 'transparent' }
                )
              }}
            >
              Student
            </button>
            <button 
              onClick={() => setRole('teacher')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                ...(role === 'teacher' 
                  ? { background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#0F172A', fontWeight: 600 }
                  : { color: '#64748B', background: 'transparent' }
                )
              }}
            >
              Teacher
            </button>
          </div>

          <h1 style={{ fontSize: isMobile ? 28 : 30, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ color: '#64748B', marginBottom: 24 }}>
            Free to join. No credit card required.
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '12px',
              borderRadius: 8, fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div style={{
              background: '#ECFDF3', color: '#16A34A', padding: '12px',
              borderRadius: 8, fontSize: 14, marginBottom: 16
            }}>
              ✓ Registration successful! Redirecting...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
            {/* Full Name field */}
            <div>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 500,
                color: '#0F172A', marginBottom: 6
              }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}>👤</span>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 500,
                color: '#0F172A', marginBottom: 6
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}>✉</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 500,
                color: '#0F172A', marginBottom: 6
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}>🔒</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading || success}
              style={{
                width: '100%', background: loading || success ? '#64748B' : '#0EA5A0',
                color: 'white', padding: isMobile ? '12px' : '13px', borderRadius: 8, fontSize: 15,
                fontWeight: 600, border: 'none', cursor: loading || success ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: '#64748B', fontSize: 14 }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#0EA5A0', fontWeight: 600 }}>
              Sign in
            </a>
          </p>
          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <a href="/" style={{ color: '#94A3B8', fontSize: 13 }}>
              Back to home
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
