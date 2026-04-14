const express = require('express');
const router = express.Router();
const ProxyController = require('../controllers/ProxyController');
const { protect } = require('../middlewares/authMiddleware');

// Using protect middleware to assume only logged in users can use the proxy. 
// For public local test, we can remove protect. Let's keep it but optional for guest, or strictly protected depending on requirement. 
// The user asked for "Multi user system", so protect is good. But we might want an open one for development testing.
// Let's protect it. 
router.post('/send', protect, ProxyController.sendRequest);

module.exports = router;
