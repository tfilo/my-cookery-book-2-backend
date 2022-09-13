import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';

import Tag from '../models/database/tag';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import { SORT_ORDER } from '../models/sortOrderEnum';
import {
    createTagSchema,
    deleteTagSchema,
    getTagSchema,
    updateTagSchema,
} from '../schemas/tag';

export const getTags = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const tags = await Tag.findAll({
            attributes: ['id', 'name'],
            order: [['name', SORT_ORDER.ASC]],
        });

        res.status(200).json(tags);
    } catch (err) {
        next(err);
    }
};

export const getTag = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof getTagSchema>>(<unknown>req);

        const tagId = request.params.tagId;
        const tag = await Tag.findByPk(tagId);

        if (!tag) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(tag);
    } catch (err) {
        next(err);
    }
};

export const createTag = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof createTagSchema>>req;

        const tag = await Tag.create(request.body, {
            fields: ['name'],
        });

        res.status(201).json(tag);
    } catch (err) {
        next(err);
    }
};

export const updateTag = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof updateTagSchema>>(<unknown>req);

        const tagId = request.params.tagId;
        const result = await sequelize.transaction(async (t) => {
            const tag = await Tag.findByPk(tagId, {
                transaction: t,
            });

            if (!tag) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const updatedTag = await tag.update(request.body, {
                fields: ['name'],
                transaction: t,
            });

            return updatedTag;
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const deleteTag = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof deleteTagSchema>>(<unknown>req);

        const tagId = request.params.tagId;
        await sequelize.transaction(async (t) => {
            const destroyed = await Tag.destroy({
                where: {
                    id: tagId,
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
