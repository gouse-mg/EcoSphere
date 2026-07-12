const crudRouter = require('../shared/crudRouter');
const controller = require('../../controllers/admin/employees.controller');

module.exports = crudRouter(controller);
