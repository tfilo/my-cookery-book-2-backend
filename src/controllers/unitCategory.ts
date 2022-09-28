import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';

import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import { SORT_ORDER } from '../models/sortOrderEnum';
import UnitCategory from '../models/database/unitCategory';
import {
    createUnitCategorySchema,
    deleteUnitCategorySchema,
    getUnitCategorySchema,
    updateUnitCategorySchema,
} from '../schemas/unitCategory';

export const getUnitCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const unitCategories = await UnitCategory.findAll({
            attributes: ['id', 'name'],
            order: [['name', SORT_ORDER.ASC]],
        });

        res.status(200).json(unitCategories);
    } catch (err) {
        next(err);
    }
};

export const getUnitCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof getUnitCategorySchema>>(
            (<unknown>req)
        );

        const unitCategoryId = request.params.unitCategoryId;
        const unitCategory = await UnitCategory.findByPk(unitCategoryId);

        if (!unitCategory) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(unitCategory);
    } catch (err) {
        next(err);
    }
};

export const createUnitCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof createUnitCategorySchema>>req;

        const unitCategory = await UnitCategory.create(request.body, {
            fields: ['name'],
        });

        res.status(201).json(unitCategory);
    } catch (err) {
        next(err);
    }
};

export const updateUnitCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof updateUnitCategorySchema>>(
            (<unknown>req)
        );

        const unitCategoryId = request.params.unitCategoryId;
        const result = await sequelize.transaction(async (t) => {
            const unitCategory = await UnitCategory.findByPk(unitCategoryId, {
                transaction: t,
            });

            if (!unitCategory) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const updatedUnitCategory = await unitCategory.update(
                request.body,
                {
                    fields: ['name'],
                    transaction: t,
                }
            );

            return updatedUnitCategory;
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteUnitCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof deleteUnitCategorySchema>>(
            (<unknown>req)
        );

        const unitCategoryId = request.params.unitCategoryId;
        await sequelize.transaction(async (t) => {
            const destroyed = await UnitCategory.destroy({
                where: {
                    id: unitCategoryId,
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
