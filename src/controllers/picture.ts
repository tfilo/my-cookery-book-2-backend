import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import sharp from 'sharp';

import Picture from '../models/database/picture';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import { SORT_ORDER } from '../models/sortOrderEnum';
import { getPictureDataSchema, getPicturesByRecipeSchema, getPictureThumbnailSchema } from '../schemas/picture';

export const getPicturesByRecipe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getPicturesByRecipeSchema>>(<unknown>req);

        const recipeId = request.params.recipeId;
        const recipes = await Picture.findAll({
            where: {
                recipeId: recipeId
            },
            attributes: ['id', 'name', 'sortNumber'],
            order: [['name', SORT_ORDER.ASC]]
        });

        res.status(200).json(recipes);
    } catch (err) {
        next(err);
    }
};

export const getPictureThumbnail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getPictureThumbnailSchema>>(<unknown>req);

        const pictureId = request.params.pictureId;
        const picture = await Picture.findByPk(pictureId, {
            attributes: ['thumbnail']
        });

        if (!picture) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', picture.thumbnail.length);
        res.end(picture.thumbnail);
    } catch (err) {
        next(err);
    }
};

export const getPictureData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getPictureDataSchema>>(<unknown>req);

        const pictureId = request.params.pictureId;
        const picture = await Picture.findByPk(pictureId, {
            attributes: ['data']
        });

        if (!picture) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', picture.data.length);
        res.end(picture.data);
    } catch (err) {
        next(err);
    }
};

export const uploadPicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = <Express.Multer.File>req.file;
        const thumbnailDimension = process.env.THUMBNAIL_DIMENSION ? +process.env.THUMBNAIL_DIMENSION : 320;
        const imageDimension = process.env.IMAGE_DIMENSION ? +process.env.IMAGE_DIMENSION : 1280;

        const image = await sharp(file.buffer, { failOnError: false })
            .resize(imageDimension, imageDimension, {
                fit: 'inside'
            })
            .jpeg({
                quality: 90,
                progressive: true,
                force: true
            })
            .toBuffer();

        const thumbnail = await sharp(file.buffer, { failOnError: false })
            .resize(thumbnailDimension, thumbnailDimension, {
                fit: 'cover'
            })
            .jpeg({
                quality: 85,
                progressive: true,
                force: true
            })
            .toBuffer();

        const fileName = file.originalname.length < 80 ? file.originalname : file.originalname.substring(0, 75) + '...';

        const picture = await Picture.create(
            {
                sortNumber: 1,
                name: fileName,
                data: image,
                thumbnail: thumbnail
            },
            {
                fields: ['sortNumber', 'name', 'data', 'thumbnail']
            }
        );

        const result = await Picture.findByPk(picture.id, {
            attributes: ['id']
        });

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};
