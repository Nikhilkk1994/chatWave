const path = require('path');
const { FileUserStore } = require('./FileUserStore');

const dataDir = path.resolve(process.env.USER_DATA_DIR || path.join(process.cwd(), 'data'));
const store = new FileUserStore(dataDir);

module.exports = { store, dataDir };
