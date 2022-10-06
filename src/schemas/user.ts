import * as yup from 'yup';

import { ROLE } from '../models/roleEnum';

export const getUserSchema = yup
    .object({
        params: yup
            .object({
                userId: yup.number().integer().min(1).required(),
            })
            .required(),
    })
    .required();

export const createUserSchema = yup
    .object({
        body: yup
            .object({
                username: yup
                    .string()
                    .trim()
                    .min(4)
                    .max(50)
                    .lowercase()
                    .matches(/^[a-z0-9]+/, 'onlyAlphaNumeric')
                    .required(),
                password: yup
                    .string()
                    .trim()
                    .min(8)
                    .max(255)
                    .matches(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                        'simplePassword'
                    )
                    .required(),
                firstName: yup
                    .string()
                    .defined()
                    .trim()
                    .min(3)
                    .max(50)
                    .nullable(),
                lastName: yup
                    .string()
                    .defined()
                    .trim()
                    .min(3)
                    .max(50)
                    .nullable(),
                roles: yup
                    .array()
                    .default([])
                    .of(yup.string().trim().oneOf(Object.keys(ROLE)).required())
                    .required(),
            })
            .required(),
    })
    .required();

export const updateUserSchema = yup
    .object({
        params: yup
            .object({
                userId: yup.number().integer().min(1).required(),
            })
            .required(),
        body: yup
            .object({
                username: yup
                    .string()
                    .trim()
                    .min(4)
                    .max(50)
                    .lowercase()
                    .matches(/^[a-z0-9]+/, 'onlyAlphaNumeric')
                    .required(),
                updatePassword: yup.boolean().defined().required(),
                password: yup
                    .string()
                    .trim()
                    .when('updatePassword', {
                        is: true,
                        then: (schema) =>
                            schema
                                .defined()
                                .min(8)
                                .max(255)
                                .matches(
                                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                                    'simplePassword'
                                )
                                .required(),
                        otherwise: (schema) => schema.defined().nullable(),
                    }),
                firstName: yup
                    .string()
                    .defined()
                    .trim()
                    .min(3)
                    .max(50)
                    .nullable(),
                lastName: yup
                    .string()
                    .defined()
                    .trim()
                    .min(3)
                    .max(50)
                    .nullable(),
                roles: yup
                    .array()
                    .default([])
                    .of(yup.string().trim().oneOf(Object.keys(ROLE)).required())
                    .required(),
            })
            .required(),
    })
    .required();

export const deleteUserSchema = yup
    .object({
        params: yup
            .object({
                userId: yup.number().integer().min(1).required(),
            })
            .required(),
    })
    .required();
