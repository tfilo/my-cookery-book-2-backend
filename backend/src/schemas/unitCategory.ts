import * as yup from 'yup';

export const getUnitCategorySchema = yup
    .object({
        params: yup
            .object({
                unitCategoryId: yup.number().min(1).required(),
            })
            .required(),
    })
    .required();

export const createUnitCategorySchema = yup
    .object({
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
            })
            .required(),
    })
    .required();

export const updateUnitCategorySchema = yup
    .object({
        params: yup
            .object({
                unitCategoryId: yup.number().min(1).required(),
            })
            .required(),
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
            })
            .required(),
    })
    .required();

export const deleteUnitCategorySchema = yup
    .object({
        params: yup
            .object({
                unitCategoryId: yup.number().min(1).required(),
            })
            .required(),
    })
    .required();
