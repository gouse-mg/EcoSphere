const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/categories.controller');

module.exports = crudRouter(controller);
