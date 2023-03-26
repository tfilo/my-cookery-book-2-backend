import express from 'express';
import multer from 'multer';

import * as pictureController from '../controllers/picture';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import {
    getPictureDataSchema,
    getPicturesByRecipeSchema,
    getPictureThumbnailSchema,
} from '../schemas/picture';

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.split('/')[0] === 'image' &&
            file.mimetype.split('/')[1] === 'jpeg'
        ) {
            cb(null, true);
        } else {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
            error.statusCode = 422;
            error.fields = {
                file: 'invalidValue',
            };
            cb(error);
        }
    },
});
const router = express.Router();

router.get(
    '/byRecipe/:recipeId',
    isAuth(),
    validate(getPicturesByRecipeSchema),
    pictureController.getPicturesByRecipe
);

router.get(
    '/thumbnail/:pictureId',
    isAuth(),
    validate(getPictureThumbnailSchema),
    pictureController.getPictureThumbnail
);

router.get(
    '/data/:pictureId',
    isAuth(),
    validate(getPictureDataSchema),
    pictureController.getPictureData
);

router.post(
    '/upload',
    isAuth([ROLE.ADMIN, ROLE.CREATOR]),
    upload.single('file'),
    (req, res, next) => {
        if (req.file) {
            next();
        } else {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
            error.statusCode = 422;
            error.fields = {
                file: 'invalidValue',
            };
            next(error);
        }
    },
    pictureController.uploadPicture
);

export default router;
