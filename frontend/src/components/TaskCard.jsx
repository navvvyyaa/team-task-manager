// simple task card component
// currently used as reference, dashboard uses inline rendering
function TaskCard({ task }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div className={`task-item ${isOverdue ? 'overdue' : ''}`}>
      <div>
        <strong>{task.title}</strong>
        {task.description && <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0' }}>{task.description}</p>}
        {task.assignedTo && <span className="assigned-to">→ {task.assignedTo.name}</span>}
      </div>
      <div className="task-meta">
        <span className={`status-badge ${task.status}`}>{task.status}</span>
        {task.dueDate && <span className="due-date">{new Date(task.dueDate).toLocaleDateString()}</span>}
      </div>
    </div>
  )
}

export default TaskCard