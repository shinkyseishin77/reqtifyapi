const express = require('express');
const router = express.Router();
const EnvironmentController = require('../controllers/EnvironmentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/', EnvironmentController.create);
router.get('/workspace/:workspaceId', EnvironmentController.listByWorkspace);
router.get('/:id', EnvironmentController.getById);
router.put('/:id', EnvironmentController.update);
router.delete('/:id', EnvironmentController.remove);

module.exports = router;
