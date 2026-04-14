const express = require('express');
const router = express.Router();
const WorkspaceController = require('../controllers/WorkspaceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/', WorkspaceController.create);
router.get('/', WorkspaceController.list);
router.get('/:id', WorkspaceController.getById);
router.put('/:id', WorkspaceController.update);
router.delete('/:id', WorkspaceController.remove);
router.post('/:id/members', WorkspaceController.addMember);
router.put('/:id/members', WorkspaceController.updateMemberRole);
router.delete('/:id/members/:userId', WorkspaceController.removeMember);

module.exports = router;
