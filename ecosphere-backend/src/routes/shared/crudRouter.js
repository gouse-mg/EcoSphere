const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');

/**
 * Builds a standard GET / , GET /:id, POST /, PUT /:id, DELETE /:id router
 * from a crudFactory controller. Individual route files can still add
 * extra routes on top of what this returns.
 */
function crudRouter(controller) {
  const router = express.Router();
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getOne));
  router.post('/', asyncHandler(controller.create));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));
  return router;
}

module.exports = crudRouter;
