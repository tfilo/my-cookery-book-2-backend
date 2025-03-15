import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';

import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import { SORT_ORDER } from '../models/sortOrderEnum';
import Unit from '../models/database/unit';
import { createUnitSchema, deleteUnitSchema, getUnitsByUnitCategorySchema, getUnitSchema, updateUnitSchema } from '../schemas/unit';

export const getUnitsByUnitCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getUnitsByUnitCategorySchema>>(<unknown>req);

        const unitCategoryId = request.params.unitCategoryId;
        const units = await Unit.findAll({
            where: {
                unitCategoryId: unitCategoryId
            },
            attributes: ['id', 'name', 'abbreviation', 'required'],
            order: [['name', SORT_ORDER.ASC]]
        });

        res.status(200).json(units);
    } catch (err) {
        next(err);
    }
};

export const getUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getUnitSchema>>(<unknown>req);

        const unitId = request.params.unitId;
        const unit = await Unit.findByPk(unitId);

        if (!unit) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(unit);
    } catch (err) {
        next(err);
    }
};

export const createUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof createUnitSchema>>req;

        const unit = await Unit.create(request.body, {
            fields: ['name', 'abbreviation', 'required', 'unitCategoryId']
        });

        res.status(201).json(unit);
    } catch (err) {
        next(err);
    }
};

export const updateUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof updateUnitSchema>>(<unknown>req);

        const unitId = request.params.unitId;
        const result = await sequelize.transaction(async (t) => {
            const unit = await Unit.findByPk(unitId, {
                transaction: t
            });

            if (!unit) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const updatedUnit = await unit.update(request.body, {
                fields: ['name', 'abbreviation', 'required', 'unitCategoryId'],
                transaction: t
            });

            return updatedUnit;
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof deleteUnitSchema>>(<unknown>req);

        const unitId = request.params.unitId;
        await sequelize.transaction(async (t) => {
            const destroyed = await Unit.destroy({
                where: {
                    id: unitId
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
