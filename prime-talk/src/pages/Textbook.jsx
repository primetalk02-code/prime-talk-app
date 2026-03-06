import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Textbook.css'

function Textbook() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          navigate('/login')
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          navigate('/login')
          return
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Auth error:', err)
        navigate('/login')
      }
    }

    checkAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className="textbook-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="textbook-container">
      <div className="textbook-header">
        <button onClick={() => navigate('/student/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Prime Talk English Textbook</h1>
      </div>

      <div className="textbook-content">
        {/* Lesson 1 */}
        <div className="lesson-card">
          <div className="lesson-number">Lesson 1</div>
          <h2>Greetings</h2>
          
          <div className="lesson-section">
            <h3>Content</h3>
            <p>
              Greetings are the first step in polite communication. Learning how to greet 
              people properly is essential for everyday English conversations. Common greetings 
              include formal and informal expressions used in different contexts.
            </p>
          </div>

          <div className="lesson-section">
            <h3>Example Sentences</h3>
            <div className="examples">
              <div className="example">
                <strong>Formal:</strong>
                <p>"Good morning! How do you do?"</p>
              </div>
              <div className="example">
                <strong>Informal:</strong>
                <p>"Hey! How's it going?"</p>
              </div>
              <div className="example">
                <strong>Friendly:</strong>
                <p>"Hi there! Nice to meet you!"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson 2 */}
        <div className="lesson-card">
          <div className="lesson-number">Lesson 2</div>
          <h2>Daily Conversation</h2>
          
          <div className="lesson-section">
            <h3>Content</h3>
            <p>
              Daily conversations are the backbone of practical English. Whether you're talking 
              about the weather, your day, or making plans, these conversations help you build 
              confidence in real-life situations. Practice these common phrases regularly.
            </p>
          </div>

          <div className="lesson-section">
            <h3>Example Sentences</h3>
            <div className="examples">
              <div className="example">
                <strong>Small Talk:</strong>
                <p>"How was your day?" "What did you have for lunch?"</p>
              </div>
              <div className="example">
                <strong>Making Plans:</strong>
                <p>"Would you like to grab coffee this weekend?"</p>
              </div>
              <div className="example">
                <strong>Expressing Feelings:</strong>
                <p>"I'm feeling great today!" "That sounds interesting!"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson 3 */}
        <div className="lesson-card">
          <div className="lesson-number">Lesson 3</div>
          <h2>Basic Grammar</h2>
          
          <div className="lesson-section">
            <h3>Content</h3>
            <p>
              Understanding basic grammar rules is crucial for forming correct sentences. 
              This lesson covers essential concepts like subject-verb agreement, tenses, 
              and sentence structure. Mastering these fundamentals will improve your writing and speaking.
            </p>
          </div>

          <div className="lesson-section">
            <h3>Example Sentences</h3>
            <div className="examples">
              <div className="example">
                <strong>Present Simple:</strong>
                <p>"I play soccer." "She likes reading books."</p>
              </div>
              <div className="example">
                <strong>Past Simple:</strong>
                <p>"I went to the park yesterday." "They finished their work."</p>
              </div>
              <div className="example">
                <strong>Future Simple:</strong>
                <p>"I will study tomorrow." "She will arrive soon."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Textbook
