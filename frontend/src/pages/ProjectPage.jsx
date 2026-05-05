import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'todo',
    dueDate: ''
  })
  const [selectedUser, setSelectedUser] = useState('')
  const [error, setError] = useState('')
  const [taskError, setTaskError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  }

  const BASE_URL = "https://team-task-manager-production-926d.up.railway.app"

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/projects/${id}`, authHeader),
        axios.get(`${BASE_URL}/api/tasks/project/${id}`, authHeader),
        axios.get(`${BASE_URL}/api/auth/users`, authHeader)
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.log(err)
      if (err.response?.status === 403) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    try {
      await axios.post(`${BASE_URL}/api/tasks`, {
        ...newTask,
        projectId: id,
        assignedTo: newTask.assignedTo || null,
        dueDate: newTask.dueDate || null
      }, authHeader)

      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        status: 'todo',
        dueDate: ''
      })

      setShowTaskForm(false)
      fetchProjectData()
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task')
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(
        `${BASE_URL}/api/tasks/${taskId}`,
        { status: newStatus },
        authHeader
      )
      fetchProjectData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axios.post(
        `${BASE_URL}/api/projects/${id}/members`,
        { userId: selectedUser },
        authHeader
      )
      setSelectedUser('')
      setShowAddMember(false)
      fetchProjectData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await axios.delete(
        `${BASE_URL}/api/tasks/${taskId}`,
        authHeader
      )
      fetchProjectData()
    } catch (err) {
      alert('Failed to delete task')
    }
  }

  if (loading) return <div className="loading">Loading project...</div>
  if (!project) return <div className="loading">Project not found</div>

  const nonMembers = users.filter(u =>
    !project.members.some(m => m._id === u._id)
  )

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h2>{project.name}</h2>
          <p className="project-desc">{project.description || 'No description'}</p>
          <p className="created-by">Created by {project.createdBy?.name}</p>
        </div>

        {user.role === 'admin' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setShowAddMember(!showAddMember)}>
              + Add Member
            </button>
            <button className="btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
              + Add Task
            </button>
          </div>
        )}
      </div>

      {showAddMember && user.role === 'admin' && (
        <div className="card">
          <h3>Add Member</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleAddMember}>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
              <option value="">Select user</option>
              {nonMembers.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <button className="btn-primary">Add</button>
          </form>
        </div>
      )}

      {showTaskForm && user.role === 'admin' && (
        <div className="card">
          <h3>Create Task</h3>
          {taskError && <div className="error-msg">{taskError}</div>}
          <form onSubmit={handleCreateTask}>
            <input
              placeholder="Title"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />
            <select
              value={newTask.assignedTo}
              onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {project.members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>

            <select
              value={newTask.status}
              onChange={e => setNewTask({ ...newTask, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <input
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
            />

            <button className="btn-primary">Create Task</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Tasks</h3>
        {tasks.map(task => (
          <div key={task._id} className="task-item">
            <strong>{task.title}</strong>
            <select
              value={task.status}
              onChange={e => handleStatusChange(task._id, e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            {user.role === 'admin' && (
              <button onClick={() => handleDeleteTask(task._id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectPage