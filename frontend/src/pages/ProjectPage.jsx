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
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        axios.get(`/api/projects/${id}`, authHeader),
        axios.get(`/api/tasks/project/${id}`, authHeader),
        axios.get('/api/auth/users', authHeader)
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
      await axios.post('/api/tasks', {
        ...newTask,
        projectId: id,
        assignedTo: newTask.assignedTo || null,
        dueDate: newTask.dueDate || null
      }, authHeader)
      setNewTask({ title: '', description: '', assignedTo: '', status: 'todo', dueDate: '' })
      setShowTaskForm(false)
      fetchProjectData()
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task')
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus }, authHeader)
      fetchProjectData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axios.post(`/api/projects/${id}/members`, { userId: selectedUser }, authHeader)
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
      await axios.delete(`/api/tasks/${taskId}`, authHeader)
      fetchProjectData()
    } catch (err) {
      alert('Failed to delete task')
    }
  }

  if (loading) return <div className="loading">Loading project...</div>
  if (!project) return <div className="loading">Project not found</div>

  // find users not already in project
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {user.role === 'admin' && (
            <>
              <button className="btn-secondary" onClick={() => setShowAddMember(!showAddMember)}>
                + Add Member
              </button>
              <button className="btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                + Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* add member form */}
      {showAddMember && user.role === 'admin' && (
        <div className="card">
          <h3>Add Member to Project</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label>Select User</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                <option value="">-- choose a user --</option>
                {nonMembers.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">Add</button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* create task form */}
      {showTaskForm && user.role === 'admin' && (
        <div className="card">
          <h3>Create Task</h3>
          {taskError && <div className="error-msg">{taskError}</div>}
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g. Design homepage"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="What needs to be done?"
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                >
                  <option value="">-- unassigned --</option>
                  {project.members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newTask.status}
                  onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">Create Task</button>
              <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* members list */}
      <div className="card">
        <h3 className="section-title">Members ({project.members?.length})</h3>
        <div className="members-list">
          {project.members?.map(m => (
            <span key={m._id} className="member-chip">{m.name}</span>
          ))}
        </div>
      </div>

      {/* tasks list */}
      <div className="card">
        <h3 className="section-title">Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="empty-msg">No tasks yet. {user.role === 'admin' ? 'Create one above!' : 'Ask admin to add tasks.'}</p>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task._id} className="task-item task-item-full">
                <div className="task-info">
                  <strong>{task.title}</strong>
                  {task.description && <p className="task-desc">{task.description}</p>}
                  {task.assignedTo && (
                    <span className="assigned-to">Assigned to: {task.assignedTo.name}</span>
                  )}
                  {task.dueDate && (
                    <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="task-actions">
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task._id, e.target.value)}
                    className={`status-select ${task.status}`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  {user.role === 'admin' && (
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteTask(task._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectPage