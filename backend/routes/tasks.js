const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

// GET /api/tasks - get all tasks (for dashboard)
// admin gets all, members get tasks in their projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find()
        .populate('project', 'name')
        .populate('assignedTo', 'name email');
    } else {
      // find projects the user is in, then get tasks from those
      const userProjects = await Project.find({ members: req.user.id }, '_id');
      const projectIds = userProjects.map(p => p._id);
      tasks = await Task.find({ project: { $in: projectIds } })
        .populate('project', 'name')
        .populate('assignedTo', 'name email');
    }
    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/project/:projectId - get tasks for a specific project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - create a task (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // only admin can create tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    const { title, description, projectId, assignedTo, status, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    const task = new Task({
      title,
      description: description || '',
      project: projectId,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      dueDate: dueDate || null
    });

    await task.save();

    // return populated task
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    res.status(201).json(populated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - update task status (members can do this for their tasks)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { status, title, description, assignedTo, dueDate } = req.body;

    // members can only update status of tasks assigned to them
    if (req.user.role === 'member') {
      if (task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not your task' });
      }
      // members can only change status
      if (status) task.status = status;
    } else {
      // admin can update everything
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (dueDate !== undefined) task.dueDate = dueDate;
    }

    await task.save();
    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;