import * as yup from 'yup';

export const getCategorySchema = yup
    .object({
        params: yup
            .object({
                categoryId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const createCategorySchema = yup
    .object({
        body: yup
            .object({
                name: yup.string().trim().max(50).required()
            })
            .required()
    })
    .required();

export const updateCategorySchema = yup
    .object({
        params: yup
            .object({
                categoryId: yup.number().integer().min(1).required()
            })
            .required(),
        body: yup
            .object({
                name: yup.string().trim().max(50).required()
            })
            .required()
    })
    .required();

export const deleteCategorySchema = yup
    .object({
        params: yup
            .object({
                categoryId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();
