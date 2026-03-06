import { useNavigate } from 'react-router-dom'

function VideoLesson() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 p-4 sm:p-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card">
        <h1 className="text-2xl font-bold text-amber-900">Video Lesson Unavailable</h1>
        <p className="mt-2 text-sm text-amber-800">
          Video lessons are temporarily disabled until the `lessons` table is created in Supabase.
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/online-teachers')}
          className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Back to Online Teachers
        </button>
      </div>
    </section>
  )
}

export default VideoLesson
