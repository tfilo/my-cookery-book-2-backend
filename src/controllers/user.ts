import { NextFunction, Request, Response } from 'express';
import { Transaction } from 'sequelize';
import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import bcrypt from 'bcryptjs';

import CustomError from '../models/customError';
import User, { UserAttributes } from '../models/database/user';
import UserRole from '../models/database/userRole';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import { ROLE } from '../models/roleEnum';
import { SORT_ORDER } from '../models/sortOrderEnum';
import {
    createUserSchema,
    deleteUserSchema,
    getUserSchema,
    resentConfirmationSchema,
    updateProfileSchema,
    updateUserSchema,
} from '../schemas/user';
import sequelize from '../util/database';
import { sendMail } from '../util/email';

export const getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users = await User.scope('listScope').findAll({
            include: {
                model: UserRole,
                as: 'roles',
                required: false,
                attributes: ['roleName'],
            },
            order: [['username', SORT_ORDER.ASC]],
        });

        res.status(200).json(
            users.map((user) => transformUserRolesToList(user))
        );
    } catch (err) {
        next(err);
    }
};

export const getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof getUserSchema>>(<unknown>req);

        const userId = request.params.userId;
        const user = await User.findByPk(userId, {
            include: {
                model: UserRole,
                as: 'roles',
                required: false,
                attributes: ['roleName'],
            },
        });

        if (!user) {
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(transformUserRolesToList(user));
    } catch (err) {
        next(err);
    }
};

export const createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof createUserSchema>>req;
        const roles = request.body.roles;
        const result = await sequelize.transaction(async (t) => {
            const uuid = uuidv4();

            const user = await User.create(
                {
                    ...request.body,
                    confirmed: false,
                    notifications: false,
                    uuid,
                },
                {
                    fields: [
                        'username',
                        'firstName',
                        'lastName',
                        'password',
                        'email',
                        'confirmed',
                        'notifications',
                        'uuid',
                    ],
                    transaction: t,
                }
            );

            await updateRoles(roles, user.id, t);

            const userWithRoles = await User.findByPk(user.id, {
                include: {
                    model: UserRole,
                    required: false,
                    attributes: ['roleName'],
                },
                transaction: t,
            });

            await sendConfirmationEmail(
                request.body.username,
                request.body.email,
                uuid,
                request.body.firstName,
                request.body.lastName
            );

            return userWithRoles;
        });

        res.status(201).json(transformUserRolesToList(result));
    } catch (err) {
        next(err);
    }
};

export const resentConfirmation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof resentConfirmationSchema>>(
            (<unknown>req)
        );
        const userId = request.params.userId;

        await sequelize.transaction(async (t) => {
            const user = await User.findByPk(userId, {
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            if (user.confirmed) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.CONSTRAINT_FAILED;
                error.statusCode = 409;
                error.message = 'Already confirmed';
                throw error;
            }

            const uuid = uuidv4();

            await user.update(
                {
                    uuid,
                },
                {
                    fields: ['uuid'],
                    transaction: t,
                }
            );

            await sendConfirmationEmail(
                user.username,
                user.email,
                uuid,
                user.firstName,
                user.lastName
            );
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const updateUserProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <
            yup.InferType<typeof updateProfileSchema> & { userId: number }
        >(<unknown>req);

        const userId = +request.userId;
        const password = request.body.password;
        const newPassword = request.body.newPassword;
        await sequelize.transaction(async (t) => {
            const user = await User.scope('fullScope').findByPk(userId, {
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
                error.statusCode = 401;
                throw error;
            }

            const updatedEmail = user.email !== request.body.email;
            const confirmed = updatedEmail ? false : user.confirmed;
            const notifications = !confirmed
                ? false
                : request.body.notifications;
            const uuid = updatedEmail ? uuidv4() : user.uuid; // preserve old UUID if email not updated
            if (!confirmed && request.body.notifications) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
                error.statusCode = 422;
                error.fields = {
                    notifications: 'invalidValue',
                };
                throw error;
            }

            if (newPassword) {
                await user.update(
                    {
                        password: newPassword,
                    },
                    {
                        fields: ['password'],
                        transaction: t,
                    }
                );
            }

            await user.update(
                {
                    firstName: request.body.firstName,
                    lastName: request.body.lastName,
                    email: request.body.email,
                    confirmed,
                    notifications,
                    uuid,
                },
                {
                    fields: [
                        'firstName',
                        'lastName',
                        'email',
                        'confirmed',
                        'notifications',
                        'uuid',
                    ],
                    transaction: t,
                }
            );

            if (updatedEmail && uuid) {
                await sendConfirmationEmail(
                    user.username,
                    request.body.email,
                    uuid,
                    request.body.firstName,
                    request.body.lastName
                );
            }
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof updateUserSchema>>(<unknown>req);
        const userId = request.params.userId;
        const roles = request.body.roles;
        const result = await sequelize.transaction(async (t) => {
            const user = await User.scope('fullScope').findByPk(userId, {
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const updatedEmail = user.email !== request.body.email;
            const confirmed = updatedEmail ? false : user.confirmed;
            const notifications = !confirmed
                ? false
                : request.body.notifications;
            const uuid = updatedEmail ? uuidv4() : user.uuid; // preserve old UUID if email not updated
            if (!confirmed && request.body.notifications) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
                error.statusCode = 422;
                error.fields = {
                    notifications: 'invalidValue',
                };
                throw error;
            }

            if (request.body.password) {
                await user.update(
                    {
                        password: request.body.password,
                    },
                    {
                        fields: ['password'],
                        transaction: t,
                    }
                );
            }

            await user.update(
                {
                    username: request.body.username,
                    firstName: request.body.firstName,
                    lastName: request.body.lastName,
                    email: request.body.email,
                    confirmed,
                    notifications,
                    uuid,
                },
                {
                    fields: [
                        'username',
                        'firstName',
                        'lastName',
                        'email',
                        'confirmed',
                        'notifications',
                        'uuid',
                    ],
                    transaction: t,
                }
            );

            await updateRoles(roles, user.id, t);

            const userWithRoles = await User.findByPk(user.id, {
                include: {
                    model: UserRole,
                    required: false,
                    attributes: ['roleName'],
                },
                transaction: t,
            });

            if (updatedEmail && uuid) {
                await sendConfirmationEmail(
                    request.body.username,
                    request.body.email,
                    uuid,
                    request.body.firstName,
                    request.body.lastName
                );
            }

            return userWithRoles;
        });

        res.status(200).json(transformUserRolesToList(result));
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const request = <yup.InferType<typeof deleteUserSchema>>(<unknown>req);

        const userId = +request.params.userId;
        await sequelize.transaction(async (t) => {
            const destroyed = await User.destroy({
                where: {
                    id: userId,
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

const sendConfirmationEmail = async (
    username: string,
    email: string,
    key: string,
    firstName?: string,
    lastName?: string
) => {
    const emailPlain = process.env.MAIL_CONFIRM_TEMPLATE_TXT_HBS;
    const emailHtml = process.env.MAIL_CONFIRM_TEMPLATE_HTML_HBS;
    const emailSubject = process.env.MAIL_CONFIRM_SUBJECT;

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

const transformUserRolesToList = (user: User | null) => {
    if (!user) {
        return null;
    }
    const userJson: UserAttributes & { roles: [{ roleName: string }] } =
        user.toJSON();

    const result = {
        ...userJson,
        roles: userJson.roles.map((r) => r.roleName),
    };

    return result;
};

const updateRoles = async (roles: ROLE[], userId: number, t: Transaction) => {
    const userRoles = await UserRole.findAll({
        where: {
            userId: userId,
        },
        transaction: t,
    });
    const promisses: (Promise<void> | Promise<UserRole>)[] = [];
    if (userRoles.length === 0) {
        roles.forEach((role) => {
            promisses.push(
                UserRole.create(
                    {
                        userId: userId,
                        roleName: role,
                    },
                    {
                        transaction: t,
                    }
                )
            );
        });
    } else {
        const toRemove = userRoles.filter((ur) => !roles.includes(ur.roleName));
        const toAdd = roles.filter(
            (r) => !userRoles.find((ur) => ur.roleName === r)
        );

        toRemove.forEach((er) => {
            promisses.push(
                er.destroy({
                    transaction: t,
                })
            );
        });

        toAdd.forEach((role) => {
            promisses.push(
                UserRole.create(
                    {
                        userId: userId,
                        roleName: role,
                    },
                    {
                        transaction: t,
                    }
                )
            );
        });
    }
    await Promise.all(promisses);
};
