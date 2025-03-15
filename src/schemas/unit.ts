import * as yup from 'yup';

export const getUnitsByUnitCategorySchema = yup
    .object({
        params: yup
            .object({
                unitCategoryId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const getUnitSchema = yup
    .object({
        params: yup
            .object({
                unitId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const createUnitSchema = yup
    .object({
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
                abbreviation: yup.string().trim().max(20).required(),
                required: yup.boolean().required(),
                unitCategoryId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const updateUnitSchema = yup
    .object({
        params: yup
            .object({
                unitId: yup.number().integer().min(1).required()
            })
            .required(),
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
                abbreviation: yup.string().trim().max(20).required(),
                required: yup.boolean().required(),
                unitCategoryId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();

export const deleteUnitSchema = yup
    .object({
        params: yup
            .object({
                unitId: yup.number().integer().min(1).required()
            })
            .required()
    })
    .required();
