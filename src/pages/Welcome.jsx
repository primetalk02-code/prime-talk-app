import { useNavigate } from 'react-router-dom'
import '../styles/Welcome.css'

function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-heading">Welcome to Prime Talk English</h1>
        <p className="welcome-description">
          Learn English with confidence. Our expert teachers are here to help you master the language through engaging and interactive lessons.
        </p>
        <div className="button-group">
          <button 
            className="btn btn-register" 
            onClick={() => navigate('/register')}
          >
            Register
          </button>
          <button 
            className="btn btn-login" 
            onClick={() => navigate('/student/login')}
          >
            Student Login
          </button>
          <button
            className="btn btn-login"
            onClick={() => navigate('/teacher/login')}
          >
            Teacher Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default Welcome
