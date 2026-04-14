const express = require('express');
const router = express.Router();

const authRoute = require('./authRoute');
const workspaceRoute = require('./workspaceRoute');
const collectionRoute = require('./collectionRoute');
const requestRoute = require('./requestRoute');
const environmentRoute = require('./environmentRoute');
const historyRoute = require('./historyRoute');
const proxyRoute = require('./proxyRoute');

router.use('/auth', authRoute);
router.use('/workspaces', workspaceRoute);
router.use('/collections', collectionRoute);
router.use('/requests', requestRoute);
router.use('/environments', environmentRoute);
router.use('/history', historyRoute);
router.use('/proxy', proxyRoute);

module.exports = router;
