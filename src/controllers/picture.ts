import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import * as yup from 'yup';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { pipeline } from 'stream/promises';

import Picture from '../models/database/picture';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import { SORT_ORDER } from '../models/sortOrderEnum';
import { getPictureDataSchema, getPicturesByRecipeSchema, getPictureThumbnailSchema } from '../schemas/picture';

// Directory with files
const pictureDir = process.env.UPLOAD_DIR ?? '/app/uploads';
const thumbnailDir = path.join(pictureDir, 'thumbnail');

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
            attributes: ['fileName']
        });

        if (!picture || !picture.fileName) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        const filePath = path.join(thumbnailDir, picture.fileName);

        try {
            await fs.promises.access(filePath);
        } catch {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        const stats = await fs.promises.stat(filePath);

        res.status(200);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', stats.size);

        const readStream = fs.createReadStream(filePath);
        try {
            await pipeline(readStream, res);
        } catch (err) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.GENERAL_ERROR;
            error.statusCode = 500;
            error.cause = err instanceof Error ? err.message : String(err);
            throw error;
        }
    } catch (err) {
        next(err);
    }
};

export const getPictureData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <yup.InferType<typeof getPictureDataSchema>>(<unknown>req);

        const pictureId = request.params.pictureId;
        const picture = await Picture.findByPk(pictureId, {
            attributes: ['fileName']
        });

        if (!picture || !picture.fileName) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        const filePath = path.join(pictureDir, picture.fileName);

        try {
            await fs.promises.access(filePath);
        } catch {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        const stats = await fs.promises.stat(filePath);

        res.status(200);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', stats.size);

        const readStream = fs.createReadStream(filePath);
        try {
            await pipeline(readStream, res);
        } catch (err) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.GENERAL_ERROR;
            error.statusCode = 500;
            error.cause = err instanceof Error ? err.message : String(err);
            throw error;
        }
    } catch (err) {
        next(err);
    }
};

export const uploadPicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = req.body;
        const thumbnailDimension = process.env.THUMBNAIL_DIMENSION ? +process.env.THUMBNAIL_DIMENSION : 320;
        const imageDimension = process.env.IMAGE_DIMENSION ? +process.env.IMAGE_DIMENSION : 1280;

        // Unique file names
        const fileUuid = uuidv4();
        const fileName = `${fileUuid}.jpg`;

        // Create upload directory if it doesn't exist
        await fs.promises.mkdir(pictureDir, { recursive: true });
        await fs.promises.mkdir(thumbnailDir, { recursive: true });

        const imageBuffer = await sharp(file, { failOn: 'none' })
            .resize(imageDimension, imageDimension, {
                fit: 'inside'
            })
            .jpeg({
                quality: 90,
                progressive: true,
                force: true
            })
            .toBuffer();

        const thumbBuffer = await sharp(file, { failOn: 'none' })
            .resize(thumbnailDimension, thumbnailDimension, {
                fit: 'cover'
            })
            .jpeg({
                quality: 85,
                progressive: true,
                force: true
            })
            .toBuffer();

        await Promise.all([
            fs.promises.writeFile(path.join(pictureDir, fileName), imageBuffer),
            fs.promises.writeFile(path.join(thumbnailDir, fileName), thumbBuffer)
        ]);

        const picture = await Picture.create(
            {
                sortNumber: 1,
                name: fileName,
                fileName: fileName
            },
            {
                fields: ['sortNumber', 'name', 'fileName']
            }
        );

        const result = await Picture.findByPk(picture.id, {
            attributes: ['id']
        });

        res.status(201).json(result);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        }
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
        error.statusCode = 422;
        error.fields = {
            file: 'invalidValue'
        };
        next(error);
    }
};
