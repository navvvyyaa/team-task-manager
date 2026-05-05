import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [projectError, setProjectError] = useState('')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        axios.get('/api/tasks', authHeader),
        axios.get('/api/projects', authHeader)
      ])
      setTasks(tasksRes.data)
      setProjects(projectsRes.data)
    } catch (err) {
      console.log('Error fetching data:', err)
      if (err.response?.status === 401) {
        // token expired, go back to login
        localStorage.clear()
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setProjectError('')
    try {
      await axios.post('/api/projects', newProject, authHeader)
      setNewProject({ name: '', description: '' })
      setShowProjectForm(false)
      fetchData() // refresh
    } catch (err) {
      setProjectError(err.response?.data?.message || 'Failed to create project')
    }
  }

  // calculate some stats for dashboard
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  // overdue = due date is in the past and not done
  const now = new Date()
  const overdueTasks = tasks.filter(t => {
    return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  })

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {user.name}! 👋</h2>
          <p className="role-badge">{user.role}</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowProjectForm(!showProjectForm)}>
            + New Project
          </button>
        )}
      </div>

      {/* create project form - only for admin */}
      {showProjectForm && (
        <div className="card">
          <h3>Create Project</h3>
          {projectError && <div className="error-msg">{projectError}</div>}
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Website Redesign"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="What is this project about?"
                rows="3"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowProjectForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* stats section */}
      <div className="stats-grid">
        <div className="stat-card stat-todo">
          <h3>{todoCount}</h3>
          <p>To Do</p>
        </div>
        <div className="stat-card stat-inprogress">
          <h3>{inProgressCount}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card stat-done">
          <h3>{doneCount}</h3>
          <p>Done</p>
        </div>
        <div className="stat-card stat-overdue">
          <h3>{overdueTasks.length}</h3>
          <p>Overdue</p>
        </div>
      </div>

      {/* overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="card">
          <h3 className="section-title overdue-title">⚠️ Overdue Tasks</h3>
          <div className="task-list">
            {overdueTasks.map(task => (
              <div key={task._id} className="task-item overdue">
                <div>
                  <strong>{task.title}</strong>
                  <span className="task-project">in {task.project?.name}</span>
                </div>
                <div className="task-meta">
                  <span className={`status-badge ${task.status}`}>{task.status}</span>
                  <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* all tasks */}
      <div className="card">
        <h3 className="section-title">All Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="empty-msg">No tasks yet. Ask your admin to create some!</p>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task._id} className="task-item">
                <div>
                  <strong>{task.title}</strong>
                  <span className="task-project">in {task.project?.name}</span>
                  {task.assignedTo && (
                    <span className="assigned-to">→ {task.assignedTo.name}</span>
                  )}
                </div>
                <div className="task-meta">
                  <span className={`status-badge ${task.status}`}>{task.status}</span>
                  {task.dueDate && (
                    <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* projects list */}
      <div className="card">
        <h3 className="section-title">Projects ({projects.length})</h3>
        {projects.length === 0 ? (
          <p className="empty-msg">No projects found.</p>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <Link key={project._id} to={`/project/${project._id}`} className="project-card">
                <h4>{project.name}</h4>
                <p>{project.description || 'No description'}</p>
                <span className="member-count">{project.members?.length || 0} members</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard