import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

import User from '../models/database/user';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import sequelize from '../util/database';
import decodeAndValidateRefreshToken from '../util/decodeAndValidatRefreshToken';
import {
    confirmSchema,
    loginSchema,
    refreshTokenSchema,
    resetPasswordLinkSchema,
    resetPasswordSchema,
} from '../schemas/auth';
import { issueRefreshToken, issueToken } from '../util/token';
import { sendMail } from '../util/email';
import moment from 'moment';

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
                confirmed: true,
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

        res.status(200).json({
            token: token,
            refreshToken: refreshToken,
        });
    } catch (err) {
        next(err);
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
                confirmed: true,
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

        res.status(200).json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        next(err);
    }
};

export const confirmEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof confirmSchema>>req;
        await sequelize.transaction(async (t) => {
            const user = await User.scope('confirmScope').findOne({
                where: {
                    username: request.body.username,
                    uuid: request.body.key,
                },
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
                error.statusCode = 401;
                throw error;
            }

            user.confirmed = true;
            user.uuid = null;
            await user.save({
                transaction: t,
            });
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const resetPasswordLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof resetPasswordLinkSchema>>(
            (<unknown>req)
        );
        const email = request.body.email;
        await sequelize.transaction(async (t) => {
            const user = await User.findOne({
                where: {
                    email,
                    confirmed: true,
                },
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.ACCOUNT_DOESNT_EXIST;
                error.statusCode = 404;
                throw error;
            }

            const uuid = uuidv4();

            await user.update(
                { uuid },
                {
                    fields: ['uuid'],
                    transaction: t,
                }
            );

            await sendResetEmail(
                user.email,
                uuid,
                user.username,
                user.firstName,
                user.lastName
            );
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof resetPasswordSchema>>(
            (<unknown>req)
        );
        const uuid = request.body.key;
        const newPassword = request.body.newPassword;
        const username = request.body.username;

        const success = await sequelize.transaction(async (t) => {
            const user = await User.scope('authScope').findOne({
                where: {
                    uuid,
                    confirmed: true,
                    username,
                },
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.ACCOUNT_DOESNT_EXIST;
                error.statusCode = 404;
                throw error;
            }

            // if uuid updated more than N hours ago, don't allow to reset
            if (
                user.updatedAt <
                moment()
                    .subtract(+(process.env.RESET_LINK_VALIDITY ?? 12), 'hours')
                    .toDate()
            ) {
                await user.update(
                    { uuid: null },
                    {
                        transaction: t,
                    }
                );
                return false;
            } else {
                await user.update(
                    { password: newPassword, uuid: null },
                    {
                        fields: ['password', 'uuid'],
                        transaction: t,
                    }
                );
            }
            return true;
        });
        if (success) {
            res.status(204).send();
        } else {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
            error.statusCode = 401;
            throw error;
        }
    } catch (err) {
        next(err);
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

const sendResetEmail = async (
    email: string,
    key: string,
    username: string,
    firstName?: string,
    lastName?: string
) => {
    const emailPlain = process.env.MAIL_RESET_TEMPLATE_TXT_HBS;
    const emailHtml = process.env.MAIL_RESET_TEMPLATE_HTML_HBS;
    const emailSubject = process.env.MAIL_RESET_SUBJECT;

    const emailData = {
        fullName: firstName && lastName ? firstName + ' ' + lastName : username,
        username,
        key,
    };

    const compiledPlain = Handlebars.compile(emailPlain)(emailData);
    const compiledHtml = Handlebars.compile(emailHtml)(emailData);

    const emailInfo = await sendMail(
        email,
        emailSubject,
        compiledPlain,
        compiledHtml
    );

    if (emailInfo && emailInfo.rejected.length > 0) {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.UNABLE_TO_SENT_EMAIL;
        error.statusCode = 503;
        throw error;
    }
};
