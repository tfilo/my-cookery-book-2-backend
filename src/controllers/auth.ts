import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import * as yup from 'yup';

import User from '../models/database/user';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import decodeAndValidateRefreshToken from '../util/decodeAndValidatRefreshToken';
import {
    loginSchema,
    refreshTokenSchema,
    updatePasswordSchema,
} from '../schemas/auth';

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof loginSchema>>req;

        const username = request.body.username;
        const password = request.body.password;
        const user = await User.scope('authScope').findOne({
            where: {
                username: username,
            },
        });

        if (!user) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
            error.statusCode = 401;
            throw error;
        }
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
            error.statusCode = 401;
            throw error;
        }

        const token = issueToken(user);
        const refreshToken = issueRefreshToken(user);

        setTimeout(() => {
            res.status(200).json({
                token: token,
                refreshToken: refreshToken,
            });
        }, 1000); // to prevent brute force password guessing, added timeout
    } catch (err) {
        setTimeout(() => {
            next(err);
        }, 1000); // to prevent brute force password guessing, added timeout
    }
};

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof refreshTokenSchema>>req;

        const refreshToken = request.body.refreshToken;
        const userId = await decodeAndValidateRefreshToken(refreshToken);
        const user = await User.scope('authScope').findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
            error.statusCode = 401;
            throw error;
        }

        const newToken = issueToken(user);
        const newRefreshToken = issueRefreshToken(user);

        setTimeout(() => {
            res.status(200).json({
                token: newToken,
                refreshToken: newRefreshToken,
            });
        }, 1000); // to prevent brute force password guessing, added timeout
    } catch (err) {
        setTimeout(() => {
            next(err);
        }, 1000); // to prevent brute force password guessing, added timeout
    }
};

export const updatePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <
            yup.InferType<typeof updatePasswordSchema> & { userId: number }
        >req;

        const userId = +request.userId;
        const password = request.body.password;
        const newPassword = request.body.newPassword;

        await sequelize.transaction(async (t) => {
            const user = await User.scope('authScope').findOne({
                where: {
                    id: userId,
                },
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
                error.statusCode = 401;
                throw error;
            }

            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
                error.statusCode = 401;
                throw error;
            }

            await user.update(
                { password: newPassword },
                {
                    transaction: t,
                }
            );
        });
        setTimeout(() => {
            res.status(204).send();
        }, 1000); // to prevent brute force password guessing, added timeout
    } catch (err) {
        setTimeout(() => {
            next(err);
        }, 1000); // to prevent brute force password guessing, added timeout
    }
};

export const user = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = <{ userId: number }>req;

        const userId = request.userId;
        const user = await User.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        const response = {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        res.status(200).send(response);
    } catch (err) {
        next(err);
    }
};

const issueToken = (user: User) => {
    const token = jwt.sign(
        {
            userId: user.id,
            roles: user.roles.map((ur) => ur.roleName),
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: process.env.TOKEN_VALIDITY ?? '1h' }
    );
    return token;
};

const issueRefreshToken = (user: User) => {
    const refreshToken = jwt.sign(
        {
            userId: user.id,
            refresh: true,
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: process.env.REFRESH_TOKEN_VALIDITY ?? '30d' }
    );
    return refreshToken;
};
