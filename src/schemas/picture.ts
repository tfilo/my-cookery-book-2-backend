import * as yup from 'yup';

export const getPicturesByRecipeSchema = yup
    .object({
        params: yup
            .object({
                recipeId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const getPictureThumbnailSchema = yup
    .object({
        params: yup
            .object({
                pictureId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const getPictureDataSchema = yup
    .object({
        params: yup
            .object({
                pictureId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();
