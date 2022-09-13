import * as yup from 'yup';

import Recipe from '../models/database/recipe';
import { SORT_ORDER } from '../models/sortOrderEnum';

export const findRecipesSchema = yup
    .object({
        body: yup
            .object({
                search: yup.string().defined().max(160).nullable(),
                categoryId: yup.number().defined().min(1).nullable(),
                tags: yup.array().of(yup.number().min(1).required()).required(),
                page: yup.number().min(0).required(),
                pageSize: yup.number().min(1).required(),
                orderBy: yup
                    .string()
                    .trim()
                    .oneOf(Object.keys(Recipe.getAttributes()))
                    .required(),
                order: yup.string().trim().oneOf(Object.keys(SORT_ORDER)).required(),
            })
            .required(),
    })
    .required();

export const getRecipeShema = yup
    .object({
        params: yup
            .object({
                recipeId: yup.number().min(1).required(),
            })
            .required(),
    })
    .required();

export const createRecipeSchema = yup
    .object({
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
                description: yup.string().trim().max(160).required(),
                serves: yup.number().defined().min(1).max(100).nullable(),
                method: yup.string().required(),
                sources: yup
                    .array()
                    .of(yup.string().trim().max(1000).required())
                    .required(),
                categoryId: yup.number().min(1).required(),
                ingredientSections: yup
                    .array()
                    .of(
                        yup.object({
                            name: yup.string().trim().max(80).required(),
                            sortNumber: yup.number().min(1).required(),
                            ingredients: yup
                                .array()
                                .of(
                                    yup.object({
                                        name: yup
                                            .string()
                                            .trim()
                                            .max(80)
                                            .required(),
                                        sortNumber: yup
                                            .number()
                                            .min(1)
                                            .required(),
                                        value: yup
                                            .number()
                                            .defined()
                                            .min(0)
                                            .nullable(),
                                        unitId: yup.number().min(1).required(),
                                    })
                                )
                                .required(),
                        })
                    )
                    .required(),
                associatedRecipes: yup
                    .array()
                    .of(yup.number().min(1).required())
                    .required(),
                tags: yup.array().of(yup.number().min(1).required()).required(),
                pictures: yup
                    .array()
                    .of(
                        yup.object({
                            id: yup.number().min(1).required(),
                            name: yup.string().trim().max(80).required(),
                            sortNumber: yup.number().min(1).required(),
                        })
                    )
                    .required(),
            })
            .required(),
    })
    .required();

export const updateRecipeSchema = yup
    .object({
        params: yup
            .object({
                recipeId: yup.number().min(1).required(),
            })
            .required(),
        body: yup
            .object({
                name: yup.string().trim().max(80).required(),
                description: yup.string().trim().max(160).required(),
                serves: yup.number().defined().min(1).max(100).optional(),
                method: yup.string().required(),
                sources: yup
                    .array()
                    .of(yup.string().trim().max(1000).required())
                    .required(),
                categoryId: yup.number().min(1).required(),
                ingredientSections: yup
                    .array()
                    .of(
                        yup.object({
                            id: yup.number().min(1).optional(),
                            name: yup.string().trim().max(80).required(),
                            sortNumber: yup.number().min(1).required(),
                            ingredients: yup
                                .array()
                                .of(
                                    yup.object({
                                        id: yup.number().min(1).optional(),
                                        name: yup
                                            .string()
                                            .trim()
                                            .max(80)
                                            .required(),
                                        sortNumber: yup
                                            .number()
                                            .min(1)
                                            .required(),
                                        value: yup
                                            .number()
                                            .defined()
                                            .min(0)
                                            .nullable(),
                                        unitId: yup.number().min(1).required(),
                                    })
                                )
                                .required(),
                        })
                    )
                    .required(),
                associatedRecipes: yup
                    .array()
                    .of(yup.number().min(1).required())
                    .required(),
                tags: yup.array().of(yup.number().min(1).required()).required(),
                pictures: yup
                    .array()
                    .of(
                        yup.object({
                            id: yup.number().min(1).required(),
                            name: yup.string().trim().max(80).required(),
                            sortNumber: yup.number().min(1).required(),
                        })
                    )
                    .required(),
            })
            .required(),
    })
    .required();

export const deleteRecipeSchema = yup
    .object({
        params: yup
            .object({
                recipeId: yup.number().min(1).required(),
            })
            .required(),
    })
    .required();
