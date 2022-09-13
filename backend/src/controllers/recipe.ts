import { NextFunction, Request, Response } from 'express';
import { IncludeOptions, Op, Transaction, WhereOptions } from 'sequelize';
import * as yup from 'yup';

import CustomError from '../models/customError';
import Ingredient from '../models/database/ingredient';
import IngredientSection from '../models/database/ingredientSection';
import Picture from '../models/database/picture';
import Recipe, { RecipeAttributes } from '../models/database/recipe';
import RecipeRecipe from '../models/database/recipeRecipe';
import RecipeTag from '../models/database/recipeTag';
import Tag from '../models/database/tag';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import { SORT_ORDER } from '../models/sortOrderEnum';
import {
    createRecipeSchema,
    deleteRecipeSchema,
    findRecipesSchema,
    getRecipeShema,
    updateRecipeSchema,
} from '../schemas/recipe';
import sequelize from '../util/database';
import toSCDF from '../util/string';

export const findRecipes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof findRecipesSchema>>req;

        const limit = request.body.pageSize;
        const offset = request.body.pageSize * request.body.page;
        const orderBy = request.body.orderBy;
        const order = request.body.order;
        const categoryId = request.body.categoryId;
        const tagIds = request.body.tags;
        const search = request.body.search;

        console.log(
            `findRecipes ->  categoryId: ${categoryId} , tagIds: ${JSON.stringify(
                tagIds
            )}, search: '${search}'`
        );

        const recipeCriteria: WhereOptions<RecipeAttributes>[] = [];
        const include: IncludeOptions[] = [
            {
                model: Picture,
                as: 'pictures',
                attributes: ['id'],
                required: false,
                limit: 1,
                order: [['sortNumber', SORT_ORDER.ASC]],
            },
        ];

        if (categoryId) {
            recipeCriteria.push({
                categoryId: {
                    [Op.eq]: categoryId,
                },
            });
        }

        if (search) {
            recipeCriteria.push({
                [Op.or]: [
                    {
                        nameSearch: {
                            [Op.like]: '%' + toSCDF(search).toLowerCase() + '%',
                        },
                    },
                    {
                        descriptionSearch: {
                            [Op.like]: '%' + toSCDF(search).toLowerCase() + '%',
                        },
                    },
                ],
            });
        }

        if (tagIds && tagIds.length > 0) {
            include.push({
                model: Tag,
                as: 'tags',
                attributes: [],
                required: true,
                where: {
                    id: {
                        [Op.in]: [tagIds],
                    },
                },
            });
        }

        const recipes = await Recipe.findAndCountAll({
            where: { [Op.and]: recipeCriteria },
            include,
            attributes: ['id', 'name', 'description'],
            distinct: true,
            limit,
            offset,
            order: [[orderBy!.toString(), order!.toString()]],
        });

        res.status(200).json({
            page: request.body.page,
            pageSize: request.body.pageSize,
            rows: recipes.rows,
            count: recipes.count,
        });
    } catch (err) {
        next(err);
    }
};

export const getRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof getRecipeShema>>(<unknown>req);

        const recipeId = request.params.recipeId;
        const recipe = await Recipe.findOne({
            where: {
                id: {
                    [Op.eq]: recipeId,
                },
            },
            include: [
                {
                    model: IngredientSection,
                    as: 'ingredientSections',
                    attributes: ['id', 'name', 'sortNumber'],
                    order: [['sortNumber', SORT_ORDER.ASC]],
                    required: false,
                    include: [
                        {
                            model: Ingredient,
                            as: 'ingredients',
                            attributes: [
                                'id',
                                'name',
                                'sortNumber',
                                'value',
                                'unitId',
                            ],
                            order: [['sortNumber', SORT_ORDER.ASC]],
                            required: false,
                        },
                    ],
                },
                {
                    model: Recipe,
                    as: 'associatedRecipes',
                    attributes: ['id', 'name', 'description'],
                    order: [['name', SORT_ORDER.ASC]],
                    required: false,
                },
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['id'],
                    order: [['name', SORT_ORDER.ASC]],
                    required: false,
                },
                {
                    model: Picture,
                    as: 'pictures',
                    attributes: ['id', 'name', 'sortNumber'],
                    order: [['sortNumber', SORT_ORDER.ASC]],
                    required: false,
                },
            ],
        });

        if (!recipe) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(recipe);
    } catch (err) {
        next(err);
    }
};

export const createRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <
            yup.InferType<typeof createRecipeSchema> & { userId: number }
        >req;

        const tagIds = request.body.tags;
        const associatedRecipeIds = request.body.associatedRecipes;
        const pictures = request.body.pictures;
        const ingredientSections = request.body.ingredientSections;
        const result = await sequelize.transaction(async (t) => {
            const recipe = await Recipe.create(
                {
                    ...request.body,
                    creatorId: request.userId,
                    modifierId: request.userId,
                },
                {
                    fields: [
                        'name',
                        'description',
                        'serves',
                        'method',
                        'sources',
                        'categoryId',
                        'creatorId',
                        'modifierId',
                    ],
                    transaction: t,
                }
            );

            await updateTags(recipe.id, tagIds, t);
            await updateAssociatedRecipes(recipe.id, associatedRecipeIds, t);
            await updatePictures(recipe.id, pictures, t);
            await updateIngredientSections(recipe.id, ingredientSections, t);

            return recipe.id;
        });
        res.status(201).json({
            recipeId: result,
        });
    } catch (err) {
        next(err);
    }
};

export const updateRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <
            yup.InferType<typeof updateRecipeSchema> & { userId: number }
        >(<unknown>req);

        const recipeId = request.params.recipeId;
        const tagIds = request.body.tags;
        const associatedRecipeIds = request.body.associatedRecipes;
        const pictures = request.body.pictures;
        const ingredientSections = request.body.ingredientSections;

        await sequelize.transaction(async (t) => {
            const recipe = await Recipe.findOne({
                where: {
                    id: {
                        [Op.eq]: recipeId,
                    },
                },
                transaction: t,
            });

            if (!recipe) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            await recipe.update(
                { ...request.body, modifierId: request.userId },
                {
                    fields: [
                        'name',
                        'description',
                        'serves',
                        'method',
                        'sources',
                        'categoryId',
                        'modifierId',
                    ],
                    transaction: t,
                }
            );

            await updateTags(recipeId, tagIds, t);
            await updateAssociatedRecipes(recipeId, associatedRecipeIds, t);
            await updatePictures(recipeId, pictures, t);
            await updateIngredientSections(recipeId, ingredientSections, t);
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const deleteRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof deleteRecipeSchema>>(
            (<unknown>req)
        );

        const recipeId = request.params.recipeId;
        await sequelize.transaction(async (t) => {
            const destroyed = await Recipe.destroy({
                where: {
                    id: recipeId,
                },
                transaction: t,
            });

            if (destroyed !== 1) {
                // should delete exactly one
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }
        });
        res.status(204).json();
    } catch (err) {
        next(err);
    }
};

const updateTags = async (
    recipeId: number,
    tagIds: number[],
    t: Transaction
) => {
    const storedRecipeTags = await RecipeTag.findAll({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        transaction: t,
    });

    let tagsToAdd;
    if (storedRecipeTags.length > 0) {
        const storedTagsToRemove = storedRecipeTags.filter(
            (srt) => tagIds.findIndex((tId) => tId === srt.tagId) === -1
        );

        const removedTags = storedTagsToRemove.map((sttr) =>
            sttr.destroy({
                transaction: t,
            })
        );

        await Promise.all(removedTags);

        tagsToAdd = tagIds.filter(
            (tid) =>
                storedRecipeTags.findIndex((srt) => srt.tagId === tid) === -1
        );
    } else {
        tagsToAdd = [...tagIds];
    }

    const createdTags = tagsToAdd.map((tagId) => {
        return RecipeTag.create(
            {
                recipeId: recipeId,
                tagId: tagId,
            },
            {
                transaction: t,
            }
        );
    });

    await Promise.all(createdTags);
};

const updateAssociatedRecipes = async (
    recipeId: number,
    associatedRecipeIds: number[],
    t: Transaction
) => {
    const storedAssociatedRecipes = await RecipeRecipe.findAll({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        transaction: t,
    });

    let associatedRecipesToAdd;
    if (storedAssociatedRecipes.length > 0) {
        const storedAssociatedRecipesToRemove = storedAssociatedRecipes.filter(
            (sar) =>
                associatedRecipeIds.findIndex(
                    (arId) => arId === sar.associatedRecipeId
                ) === -1
        );

        const removedAssociatedRecipes = storedAssociatedRecipesToRemove.map(
            (sartr) =>
                sartr.destroy({
                    transaction: t,
                })
        );

        await Promise.all(removedAssociatedRecipes);

        associatedRecipesToAdd = associatedRecipeIds.filter(
            (arid) =>
                storedAssociatedRecipes.findIndex(
                    (sar) => sar.associatedRecipeId === arid
                ) === -1
        );
    } else {
        associatedRecipesToAdd = [...associatedRecipeIds];
    }

    const createdAssociatedRecipes = associatedRecipesToAdd.map(
        (associatedRecipeId) => {
            return RecipeRecipe.create(
                {
                    recipeId: recipeId,
                    associatedRecipeId: associatedRecipeId,
                },
                {
                    transaction: t,
                }
            );
        }
    );

    await Promise.all(createdAssociatedRecipes);
};

const updatePictures = async (
    recipeId: number,
    pictures: {
        id: number;
        name: string;
        sortNumber: number;
    }[],
    t: Transaction
) => {
    const storedPictures = await Picture.findAll({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        transaction: t,
    });

    const picturesToRemove = storedPictures.filter(
        (sp) => pictures.findIndex((p) => p.id === sp.id) === -1
    );

    const removedPictures = picturesToRemove.map((ptr) =>
        ptr.destroy({
            transaction: t,
        })
    );

    await Promise.all(removedPictures);

    const createdPictures = pictures.map(async (picture) => {
        const storedPicture = await Picture.findOne({
            where: {
                id: {
                    [Op.eq]: picture.id,
                },
            },
            transaction: t,
        });

        if (!storedPicture) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        return storedPicture.update(
            {
                name: picture.name,
                sortNumber: picture.sortNumber,
                recipeId: recipeId,
            },
            {
                fields: ['name', 'sortNumber', 'recipeId'],
                transaction: t,
            }
        );
    });

    await Promise.all(createdPictures);

    const date = new Date();
    date.setDate(date.getDate() - 1);

    // clean up database, uploaded pictures not assigned to recipe, older than one day
    const orphans = await Picture.findAll({
        where: {
            [Op.and]: [
                {
                    recipeId: {
                        [Op.eq]: null,
                    },
                },
                {
                    createdAt: {
                        [Op.lte]: date,
                    },
                },
            ],
        },
        transaction: t,
    });

    const removedOrphans = orphans.map((ptr) =>
        ptr.destroy({
            transaction: t,
        })
    );

    await Promise.all(removedOrphans);
};

const updateIngredientSections = async (
    recipeId: number,
    ingredientSections: {
        id?: number;
        name: string;
        sortNumber: number;
        ingredients: {
            id?: number;
            name: string;
            sortNumber: number;
            value: number;
            unitId: number;
        }[];
    }[],
    t: Transaction
) => {
    const storedIngredientSections = await IngredientSection.findAll({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        transaction: t,
    });

    let sectionsToAdd;
    if (storedIngredientSections.length > 0) {
        const existingSection = ingredientSections.filter(
            (is) => is.id !== undefined
        );
        const sectionsToRemove = storedIngredientSections.filter(
            (sis) => existingSection.findIndex((is) => is.id === sis.id) === -1
        );

        const removedSections = sectionsToRemove.map((str) =>
            str.destroy({
                transaction: t,
            })
        );

        await Promise.all(removedSections);

        sectionsToAdd = ingredientSections.filter((is) => is.id === undefined); // where no id provided, it is new section

        const sectionsToUpdate = storedIngredientSections.filter(
            (sis) => existingSection.findIndex((is) => is.id === sis.id) > -1
        );

        const updatedSections = sectionsToUpdate.map(async (stu) => {
            const savedSection = existingSection.find((es) => es.id === stu.id);
            if (!savedSection) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const ingredients = await Ingredient.findAll({
                where: {
                    ingredientSectionId: {
                        [Op.eq]: stu.id,
                    },
                },
                transaction: t,
            });

            let ingredientsToAdd;
            if (ingredients.length > 0) {
                const ingredientsToUpdate = savedSection.ingredients.filter(
                    (i) => i.id !== undefined
                );

                const ingredientsToRemove = ingredients.filter(
                    (itr) =>
                        ingredientsToUpdate.findIndex(
                            (itu) => itu.id === itr.id
                        ) === -1
                );

                const removedIngredients = ingredientsToRemove.map((itr) =>
                    itr.destroy({
                        transaction: t,
                    })
                );

                await Promise.all(removedIngredients);

                const updatedIngredients = ingredients.map((i) => {
                    const savedIngredient = ingredientsToUpdate.find(
                        (itu) => itu.id === i.id
                    );
                    if (!savedIngredient) {
                        const error = new CustomError();
                        error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                        error.statusCode = 404;
                        throw error;
                    }
                    return i.update(savedIngredient, {
                        fields: ['name', 'sortNumber', 'value', 'unitId'],
                        transaction: t,
                    });
                });

                await Promise.all(updatedIngredients);

                ingredientsToAdd = savedSection.ingredients.filter(
                    (i) => i.id === undefined
                );
            } else {
                ingredientsToAdd = [...savedSection.ingredients];
            }

            const createdIngredients = ingredientsToAdd.map((ita) => {
                return Ingredient.create(
                    {
                        ...ita,
                        ingredientSectionId: stu.id,
                    },
                    {
                        fields: [
                            'name',
                            'sortNumber',
                            'value',
                            'unitId',
                            'ingredientSectionId',
                        ],
                        transaction: t,
                    }
                );
            });

            await Promise.all(createdIngredients);

            return await stu.update(
                {
                    name: savedSection.name,
                    sortNumber: savedSection.sortNumber,
                },
                {
                    fields: ['name', 'sortNumber'],
                    transaction: t,
                }
            );
        });

        await Promise.all(updatedSections);
    } else {
        sectionsToAdd = [...ingredientSections];
    }

    const createdIngredientSection = sectionsToAdd.map(
        async (ingredientSection) => {
            const createdIngredientSection = await IngredientSection.create(
                {
                    name: ingredientSection.name,
                    sortNumber: ingredientSection.sortNumber,
                    recipeId: recipeId,
                },
                {
                    fields: ['name', 'sortNumber', 'recipeId'],
                    transaction: t,
                }
            );

            const createdIngredients = ingredientSection.ingredients.map(
                (ingredient) => {
                    return Ingredient.create(
                        {
                            ...ingredient,
                            ingredientSectionId: createdIngredientSection.id,
                        },
                        {
                            fields: [
                                'name',
                                'sortNumber',
                                'value',
                                'unitId',
                                'ingredientSectionId',
                            ],
                            transaction: t,
                        }
                    );
                }
            );

            await Promise.all(createdIngredients);

            return createdIngredientSection;
        }
    );
    await Promise.all(createdIngredientSection);
};
