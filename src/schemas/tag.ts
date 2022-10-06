import * as yup from 'yup';

export const getTagSchema = yup
    .object({
        params: yup
            .object({
                tagId: yup.number().integer().min(1).required(),
            })
            .required(),
    })
    .required();

export const createTagSchema = yup
    .object({
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
            })
            .required(),
    })
    .required();

export const updateTagSchema = yup
    .object({
        params: yup
            .object({
                tagId: yup.number().integer().min(1).required(),
            })
            .required(),
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
            })
            .required(),
    })
    .required();

export const deleteTagSchema = yup
    .object({
        params: yup
            .object({
                tagId: yup.number().integer().min(1).required(),
            })
            .required(),
    })
    .required();
