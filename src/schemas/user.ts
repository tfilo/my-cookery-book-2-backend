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
                email: yup.string().trim().min(5).max(320).email().required(),
                notifications: yup.boolean().default(false).required(),
                roles: yup
                    .array()
                    .of(
                        yup
                            .mixed<ROLE>()
                            .oneOf(Object.keys(ROLE) as ROLE[])
                            .required()
                    )
                    .required(),
            })
            .required(),
    })
    .required();

export const updateProfileSchema = yup.object({
    body: yup
        .object({
            password: yup.string().trim().max(255).required(),
            newPassword: yup
                .string()
                .defined()
                .trim()
                .min(8)
                .max(255)
                .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                    'simplePassword'
                )
                .nullable(),
            firstName: yup.string().defined().trim().min(3).max(50).nullable(),
            lastName: yup.string().defined().trim().min(3).max(50).nullable(),
            email: yup.string().trim().min(5).max(320).email().required(),
            notifications: yup.boolean().default(false).required(),
        })
        .required(),
});

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
                    .matches(/^[a-z0-9]+/, 'onlyAlphaNumeric')
                    .required(),
                password: yup
                    .string()
                    .defined()
                    .trim()
                    .min(8)
                    .max(255)
                    .matches(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                        'simplePassword'
                    )
                    .nullable(),
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
                email: yup.string().trim().min(5).max(320).email().required(),
                notifications: yup.boolean().default(false).required(),
                roles: yup
                    .array()
                    .of(
                        yup
                            .mixed<ROLE>()
                            .oneOf(Object.keys(ROLE) as ROLE[])
                            .required()
                    )
                    .required(),
            })
            .required(),
    })
    .required();

export const resentConfirmationSchema = yup
    .object({
        params: yup
            .object({
                userId: yup.number().integer().min(1).required(),
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
