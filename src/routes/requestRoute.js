const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/RequestController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.post('/', RequestController.create);
router.get('/:id', RequestController.getById);
router.put('/:id', RequestController.update);
router.delete('/:id', RequestController.remove);

module.exports = router;
