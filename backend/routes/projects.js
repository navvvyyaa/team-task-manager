const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

// GET /api/projects - get all projects (admin sees all, member sees theirs)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      // admin can see everything
      projects = await Project.find().populate('createdBy', 'name email').populate('members', 'name email');
    } else {
      // members only see projects they're part of
      projects = await Project.find({ members: req.user.id })
        .populate('createdBy', 'name email')
        .populate('members', 'name email');
    }
    res.json(projects);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - create a project (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = new Project({
      name,
      description: description || '',
      createdBy: req.user.id,
      members: [req.user.id] // admin is automatically a member
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - get single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // check access - admin or member of project
    const isMember = project.members.some(m => m._id.toString() === req.user.id);
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - add member to project (admin only)
router.post('/:id/members', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // dont add duplicates
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();

    const updated = await Project.findById(project._id).populate('members', 'name email');
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;