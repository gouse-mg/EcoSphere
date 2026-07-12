const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/departments.controller');

module.exports = crudRouter(controller);
