import express from 'express';

import * as recipeController from '../controllers/recipe';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import { createRecipeSchema, deleteRecipeSchema, findRecipesSchema, getRecipeShema, updateRecipeSchema } from '../schemas/recipe';

const router = express.Router();

router.post('/find', isAuth(), validate(findRecipesSchema), recipeController.findRecipes);

router.get('/:recipeId', isAuth(), validate(getRecipeShema), recipeController.getRecipe);

router.post('/', isAuth([ROLE.ADMIN, ROLE.CREATOR]), validate(createRecipeSchema), recipeController.createRecipe);

router.put('/:recipeId', isAuth([ROLE.ADMIN, ROLE.CREATOR]), validate(updateRecipeSchema), recipeController.updateRecipe);

router.delete('/:recipeId', isAuth([ROLE.ADMIN, ROLE.CREATOR]), validate(deleteRecipeSchema), recipeController.deleteRecipe);

export default router;
