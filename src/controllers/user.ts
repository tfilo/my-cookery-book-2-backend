import { NextFunction, Request, Response } from 'express';
import { Transaction } from 'sequelize';
import * as yup from 'yup';

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
    updateUserSchema,
} from '../schemas/user';
import sequelize from '../util/database';

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

        res.status(200).json(users.map(user => transformUserRolesToList(user)));
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
            const user = await User.create(request.body, {
                fields: ['username', 'firstName', 'lastName', 'password'],
                transaction: t,
            });

            updateRoles(roles, user.id, t);

            const userWithRoles = await User.findByPk(user.id, {
                include: {
                    model: UserRole,
                    required: false,
                    attributes: ['roleName'],
                },
                transaction: t,
            });

            return userWithRoles;
        });

        res.status(201).json(transformUserRolesToList(result));
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
            const user = await User.findByPk(userId, {
                transaction: t,
            });

            if (!user) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.NOT_FOUND;
                error.statusCode = 404;
                throw error;
            }

            const fields: (keyof UserAttributes)[] = [
                'username',
                'firstName',
                'lastName',
            ];
            if (request.body.password) {
                fields.push('password');
            }

            await user.update(
                {
                    username: request.body.username,
                    firstName: request.body.firstName,
                    lastName: request.body.lastName,
                },
                {
                    fields,
                    transaction: t,
                }
            );

            updateRoles(roles, user.id, t);

            const userWithRoles = await User.findByPk(user.id, {
                include: {
                    model: UserRole,
                    required: false,
                    attributes: ['roleName'],
                },
                transaction: t,
            });

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
