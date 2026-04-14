const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/', HistoryController.list);
router.delete('/:id', HistoryController.remove);
router.delete('/clear/:workspaceId', HistoryController.clear);

module.exports = router;
