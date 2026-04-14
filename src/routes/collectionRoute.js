const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/CollectionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/', CollectionController.create);
router.get('/workspace/:workspaceId', CollectionController.listByWorkspace);
router.get('/:id', CollectionController.getById);
router.put('/:id', CollectionController.update);
router.delete('/:id', CollectionController.remove);

module.exports = router;
