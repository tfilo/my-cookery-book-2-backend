import express from 'express';

import * as unitCategoryController from '../controllers/unitCategory';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import {
    createUnitCategorySchema,
    deleteUnitCategorySchema,
    getUnitCategorySchema,
    updateUnitCategorySchema
} from '../schemas/unitCategory';

const router = express.Router();

router.get('/', isAuth(), unitCategoryController.getUnitCategories);

router.get('/:unitCategoryId', isAuth(ROLE.ADMIN), validate(getUnitCategorySchema), unitCategoryController.getUnitCategory);

router.post('/', isAuth(ROLE.ADMIN), validate(createUnitCategorySchema), unitCategoryController.createUnitCategory);

router.put('/:unitCategoryId', isAuth(ROLE.ADMIN), validate(updateUnitCategorySchema), unitCategoryController.updateUnitCategory);

router.delete('/:unitCategoryId', isAuth(ROLE.ADMIN), validate(deleteUnitCategorySchema), unitCategoryController.deleteUnitCategory);

export default router;
