import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        TaskFlow
      </Link>
      <div className="nav-right">
        <span className="nav-user">{user.name} <span className="nav-role">({user.role})</span></span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  )
}

export default Navbar