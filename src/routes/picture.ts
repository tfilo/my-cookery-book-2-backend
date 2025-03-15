import express from 'express';

import * as pictureController from '../controllers/picture';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import { getPictureDataSchema, getPicturesByRecipeSchema, getPictureThumbnailSchema } from '../schemas/picture';

const router = express.Router();

router.get('/byRecipe/:recipeId', isAuth(), validate(getPicturesByRecipeSchema), pictureController.getPicturesByRecipe);

router.get('/thumbnail/:pictureId', isAuth(), validate(getPictureThumbnailSchema), pictureController.getPictureThumbnail);

router.get('/data/:pictureId', isAuth(), validate(getPictureDataSchema), pictureController.getPictureData);

router.post('/upload', isAuth([ROLE.ADMIN, ROLE.CREATOR]), pictureController.uploadPicture);

export default router;
