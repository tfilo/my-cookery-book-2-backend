import { NextFunction, Request, Response } from 'express';
import { Op, Transaction, WhereOptions } from 'sequelize';
import * as yup from 'yup';

import CustomError from '../models/customError';
import Ingredient from '../models/database/ingredient';
import RecipeSection from '../models/database/recipeSection';
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
import User from '../models/database/user';
import Unit from '../models/database/unit';

export const findRecipes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof findRecipesSchema>>req;

        const limit = request.body.pageSize;
        const offset = request.body.pageSize * request.body.page;
        const orderBy =
            request.body.orderBy === 'name'
                ? 'nameSearch'
                : request.body.orderBy;
        const order = request.body.order;
        const categoryId = request.body.categoryId;
        const tagIds = request.body.tags;
        const search = request.body.search;

        const recipeCriteria: WhereOptions<RecipeAttributes>[] = [];

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
            const tags = await RecipeTag.findAll({
                attributes: [
                    'recipeId',
                    [sequelize.fn('COUNT', sequelize.col('recipeId')), 'count'],
                ],
                where: {
                    tagId: {
                        [Op.in]: tagIds,
                    },
                },
                group: ['recipeId'],
            });
            const recipeIdsByTag = tags
                .filter(
                    (t) =>
                        (
                            t.toJSON() as unknown as {
                                recipeId: number;
                                count: string;
                            }
                        ).count === `${tagIds.length}`
                )
                .map(
                    (t) =>
                        (
                            t.toJSON() as unknown as {
                                recipeId: number;
                                count: string;
                            }
                        ).recipeId
                );
            recipeCriteria.push({
                id: {
                    [Op.in]: recipeIdsByTag,
                },
            });
        }

        const recipes = await Recipe.findAndCountAll({
            where: { [Op.and]: recipeCriteria },
            include: {
                model: Picture,
                as: 'pictures',
                attributes: ['id'],
                required: false,
                limit: 1,
                order: [['sortNumber', SORT_ORDER.ASC]],
            },
            attributes: ['id', 'name', 'description'],
            distinct: true,
            subQuery: false,
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
            attributes: [
                'id',
                'name',
                'description',
                'serves',
                'method',
                'sources',
                'categoryId',
                'modifierId',
                'creatorId',
                'createdAt',
                'updatedAt',
            ],
            include: [
                {
                    model: RecipeSection,
                    as: 'recipeSections',
                    attributes: ['id', 'name', 'sortNumber', 'method'],
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
                            include: [
                                {
                                    model: Unit,
                                    as: 'unit',
                                    attributes: ['name', 'abbreviation'],
                                },
                            ],
                            required: false,
                        },
                    ],
                },
                {
                    model: Recipe,
                    as: 'associatedRecipes',
                    through: {
                        attributes: [],
                    },
                    attributes: ['id', 'name', 'description'],
                    required: false,
                },
                {
                    model: Tag,
                    as: 'tags',
                    through: {
                        attributes: [],
                    },
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: Picture,
                    as: 'pictures',
                    attributes: ['id', 'name', 'sortNumber'],
                    required: false,
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['username', 'firstName', 'lastName'],
                    required: false,
                },
                {
                    model: User,
                    as: 'modifier',
                    attributes: ['username', 'firstName', 'lastName'],
                    required: false,
                },
            ],
            order: [
                ['recipeSections', 'sortNumber', SORT_ORDER.ASC],
                ['recipeSections', 'ingredients', 'sortNumber', SORT_ORDER.ASC],
                ['associatedRecipes', 'name', SORT_ORDER.ASC],
                ['tags', 'name', SORT_ORDER.ASC],
                ['pictures', 'sortNumber', SORT_ORDER.ASC],
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
        const recipeSections = request.body.recipeSections;

        const result = await sequelize.transaction(async (t) => {
            const recipe = await Recipe.create(
                {
                    ...request.body,
                    nameSearch: toSCDF(request.body.name).toLowerCase().trim(),
                    descriptionSearch: toSCDF(request.body.description)
                        .toLowerCase()
                        .trim(),
                    creatorId: request.userId,
                    modifierId: request.userId,
                },
                {
                    fields: [
                        'name',
                        'nameSearch',
                        'description',
                        'descriptionSearch',
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
            await updateRecipeSections(recipe.id, recipeSections, t);

            return recipe.id;
        });
        res.status(201).json({
            id: result,
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
        const recipeSections = request.body.recipeSections;

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
                {
                    ...request.body,
                    nameSearch: toSCDF(request.body.name).toLowerCase().trim(),
                    descriptionSearch: toSCDF(request.body.description)
                        .toLowerCase()
                        .trim(),
                    modifierId: request.userId,
                },
                {
                    fields: [
                        'name',
                        'nameSearch',
                        'description',
                        'descriptionSearch',
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
            await updateRecipeSections(recipeId, recipeSections, t);
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
    await RecipeRecipe.destroy({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        transaction: t,
    });

    const createdAssociatedRecipes = associatedRecipeIds.map(
        (associatedRecipeId) =>
            RecipeRecipe.create(
                {
                    recipeId: recipeId,
                    associatedRecipeId: associatedRecipeId,
                },
                {
                    transaction: t,
                }
            )
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

const updateRecipeSections = async (
    recipeId: number,
    recipeSections: {
        id?: number;
        name: string | null;
        sortNumber: number;
        method: string | null;
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
    const dbRecipeSections = await RecipeSection.findAll({
        where: {
            recipeId: {
                [Op.eq]: recipeId,
            },
        },
        include: [
            {
                model: Ingredient,
                as: 'ingredients',
            },
        ],
        transaction: t,
    });

    let sectionsToAdd;
    if (dbRecipeSections.length > 0) {
        const existingSection = recipeSections.filter(
            (rs) => rs.id !== undefined
        );
        const sectionsToRemove = dbRecipeSections.filter(
            (dbrs) =>
                existingSection.findIndex((es) => es.id === dbrs.id) === -1
        );
        const removedSections = sectionsToRemove.map((str) =>
            str.destroy({
                transaction: t,
            })
        );

        await Promise.all(removedSections);
        sectionsToAdd = recipeSections.filter((rs) => rs.id === undefined); // where no id provided, it is new section

        const sectionsToUpdate = dbRecipeSections.filter(
            (dbrs) => existingSection.findIndex((es) => es.id === dbrs.id) > -1
        );

        const updatedSections = sectionsToUpdate.map(async (stu) => {
            const savedSection = existingSection.find((es) => es.id === stu.id);
            if (!savedSection) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }
            let ingredientsToAdd;
            if (stu.ingredients.length > 0) {
                const ingredientsToUpdate = savedSection.ingredients.filter(
                    (i) => i.id !== undefined
                );

                const ingredientsToRemove = stu.ingredients.filter(
                    (i) =>
                        savedSection.ingredients.findIndex(
                            (itu) => itu.id === i.id
                        ) === -1
                );

                const removedIngredients = ingredientsToRemove.map((itr) =>
                    itr.destroy({
                        transaction: t,
                    })
                );

                await Promise.all(removedIngredients);

                const updatedIngredients = ingredientsToUpdate.map((i) => {
                    console.log('Updating', i);

                    const savedIngredient = stu.ingredients.find(
                        (itu) => itu.id === i.id
                    );
                    if (!savedIngredient) {
                        const error = new CustomError();
                        error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                        error.statusCode = 404;
                        throw error;
                    }
                    return savedIngredient.update(i, {
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
                        recipeSectionId: stu.id,
                    },
                    {
                        fields: [
                            'name',
                            'sortNumber',
                            'value',
                            'unitId',
                            'recipeSectionId',
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
                    method: savedSection.method,
                },
                {
                    fields: ['name', 'sortNumber', 'method'],
                    transaction: t,
                }
            );
        });

        await Promise.all(updatedSections);
    } else {
        sectionsToAdd = [...recipeSections];
    }

    const createdRecipeSection = sectionsToAdd.map(async (recipeSection) => {
        const createdRecipeSection = await RecipeSection.create(
            {
                name: recipeSection.name,
                sortNumber: recipeSection.sortNumber,
                method: recipeSection.method,
                recipeId: recipeId,
            },
            {
                fields: ['name', 'sortNumber', 'method', 'recipeId'],
                transaction: t,
            }
        );

        const createdIngredients = recipeSection.ingredients.map(
            (ingredient) => {
                return Ingredient.create(
                    {
                        ...ingredient,
                        recipeSectionId: createdRecipeSection.id,
                    },
                    {
                        fields: [
                            'name',
                            'sortNumber',
                            'value',
                            'unitId',
                            'recipeSectionId',
                        ],
                        transaction: t,
                    }
                );
            }
        );

        await Promise.all(createdIngredients);

        return createdRecipeSection;
    });
    await Promise.all(createdRecipeSection);
};
