import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const teachers = [
  {
    name: 'Mia Carter',
    specialty: 'Business English',
    experience: '8 years',
    accent: 'US',
  },
  {
    name: 'Daniel Morris',
    specialty: 'IELTS Speaking',
    experience: '6 years',
    accent: 'UK',
  },
  {
    name: 'Aya Romero',
    specialty: 'Daily Conversation',
    experience: '7 years',
    accent: 'Global',
  },
]

const steps = [
  {
    title: 'Pick Your Goal',
    description: 'Choose fluency, test prep, interview training, or daily conversation outcomes.',
  },
  {
    title: 'Start Live Lessons',
    description: 'Join instant lessons or reserve sessions with teachers who match your needs.',
  },
  {
    title: 'Track Real Progress',
    description: 'Monitor streaks, completed lessons, and confidence milestones in one dashboard.',
  },
]

const testimonials = [
  {
    quote:
      'I finally feel comfortable speaking in meetings. The sudden lesson feature helped me practice daily.',
    name: 'Nina S.',
    role: 'Product Manager',
  },
  {
    quote: 'The platform is clean and focused. I booked lessons fast and improved my IELTS score in two months.',
    name: 'Tariq A.',
    role: 'Graduate Applicant',
  },
  {
    quote: 'As a tutor, managing reservations and live sessions in one place is exactly what I needed.',
    name: 'Olivia R.',
    role: 'English Tutor',
  },
]

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.14),transparent_40%)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-card backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700">
              PT
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Prime Talk</p>
              <p className="text-sm text-slate-500">Modern English Tutoring Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="text-slate-700 hover:bg-slate-100"
              onClick={() => navigate('/student/login')}
            >
              Student Login
            </Button>
            <Button
              variant="ghost"
              className="text-slate-700 hover:bg-slate-100"
              onClick={() => navigate('/teacher/login')}
            >
              Teacher Login
            </Button>
            <Button onClick={() => navigate('/register')}>Get Started</Button>
          </div>
        </header>

        <section className="grid animate-fade-up gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge variant="info">Built for daily speaking confidence</Badge>
            <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
              Learn faster with live tutors, instant lessons, and focused progress tracking.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
              Prime Talk combines structured lesson paths and on-demand speaking practice in one clean SaaS
              workspace for students and teachers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/register')}>
                Start Learning
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                onClick={() => navigate('/student/login')}
              >
                Explore Student Portal
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-slate-200 bg-white shadow-card">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-slate-900">12k+</p>
                  <p className="text-sm text-slate-500">Live sessions completed</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-card">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-slate-900">96%</p>
                  <p className="text-sm text-slate-500">Student satisfaction</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-card">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-slate-900">40+</p>
                  <p className="text-sm text-slate-500">Expert tutors online</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-sky-50 to-cyan-50 shadow-soft">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-sky-700">Live Platform Snapshot</p>
                <Badge variant="success">Tutors Online</Badge>
              </div>
              <div className="space-y-3">
                {['Sudden lesson matching', 'Reservation calendar', 'Lesson room with Daily.co'].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-card"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
                Prime Talk helps learners stay consistent with short, high-impact speaking sessions every day.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Teacher Showcase</h2>
              <p className="text-sm text-slate-500">Experienced tutors tailored to your goals.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/student/login')}>
              Browse Teachers
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {teachers.map((teacher) => (
              <Card
                key={teacher.name}
                className="border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{teacher.name}</p>
                    <Badge variant="secondary">{teacher.accent}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{teacher.specialty}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{teacher.experience} experience</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-5">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How It Works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.title} className="border-slate-200 bg-white shadow-card">
                <CardContent className="space-y-3 p-5">
                  <Badge variant="info" className="w-fit">
                    Step {index + 1}
                  </Badge>
                  <p className="text-lg font-bold text-slate-900">{step.title}</p>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-5">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Student Testimonials</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="border-slate-200 bg-white shadow-card">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm text-slate-700">&quot;{item.quote}&quot;</p>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 shadow-soft">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xl font-bold text-slate-900">Ready to accelerate your English speaking?</p>
                <p className="text-sm text-slate-600">Create your account and start your first live session today.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/register')}>Create Account</Button>
                <Button
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  onClick={() => navigate('/student/login')}
                >
                  Student Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default LandingPage
