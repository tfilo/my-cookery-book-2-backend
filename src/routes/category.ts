import express from 'express';

import * as categoryController from '../controllers/category';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import { createCategorySchema, deleteCategorySchema, getCategorySchema, updateCategorySchema } from '../schemas/category';

const router = express.Router();

router.get('/', isAuth(), categoryController.getCategories);

router.get('/:categoryId', isAuth(ROLE.ADMIN), validate(getCategorySchema), categoryController.getCategory);

router.post('/', isAuth(ROLE.ADMIN), validate(createCategorySchema), categoryController.createCategory);

router.put('/:categoryId', isAuth(ROLE.ADMIN), validate(updateCategorySchema), categoryController.updateCategory);

router.delete('/:categoryId', isAuth(ROLE.ADMIN), validate(deleteCategorySchema), categoryController.deleteCategory);

export default router;
