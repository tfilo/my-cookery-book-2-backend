import express from 'express';

import * as unitController from '../controllers/unit';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import { createUnitSchema, deleteUnitSchema, getUnitsByUnitCategorySchema, getUnitSchema, updateUnitSchema } from '../schemas/unit';

const router = express.Router();

router.get('/byUnitCategory/:unitCategoryId', isAuth(), validate(getUnitsByUnitCategorySchema), unitController.getUnitsByUnitCategory);

router.get('/:unitId', isAuth(), validate(getUnitSchema), unitController.getUnit);

router.post('/', isAuth(ROLE.ADMIN), validate(createUnitSchema), unitController.createUnit);

router.put('/:unitId', isAuth(ROLE.ADMIN), validate(updateUnitSchema), unitController.updateUnit);

router.delete('/:unitId', isAuth(ROLE.ADMIN), validate(deleteUnitSchema), unitController.deleteUnit);

export default router;
