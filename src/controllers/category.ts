import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';

import Category from '../models/database/category';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import { SORT_ORDER } from '../models/sortOrderEnum';
import { createCategorySchema, deleteCategorySchema, getCategorySchema, updateCategorySchema } from '../schemas/category';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name'],
            order: [['name', SORT_ORDER.ASC]]
        });

        res.status(200).json(categories);
    } catch (err) {
        next(err);
    }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getCategorySchema>>(<unknown>req);

        const categoryId = request.params.categoryId;
        const category = await Category.findByPk(categoryId);

        if (!category) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(category);
    } catch (err) {
        next(err);
    }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof createCategorySchema>>req;

        const category = await Category.create(request.body, {
            fields: ['name']
        });

        res.status(201).json(category);
    } catch (err) {
        next(err);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof updateCategorySchema>>(<unknown>req);

        const categoryId = request.params.categoryId;
        const result = await sequelize.transaction(async (t) => {
            const category = await Category.findByPk(categoryId, {
                transaction: t
            });

            if (!category) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const updatedCategory = await category.update(request.body, {
                fields: ['name'],
                transaction: t
            });

            return updatedCategory;
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof deleteCategorySchema>>(<unknown>req);

        const categoryId = request.params.categoryId;
        await sequelize.transaction(async (t) => {
            const destroyed = await Category.destroy({
                where: {
                    id: categoryId
                },
                transaction: t
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
