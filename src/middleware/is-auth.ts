import { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, JwtPayload, NotBeforeError, Secret, TokenExpiredError } from 'jsonwebtoken';

import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import { ROLE } from '../models/roleEnum';

export const checkRoles = (userRoles: string[], allowedRoles?: ROLE | ROLE[]) => {
    if (allowedRoles && allowedRoles.length > 0) {
        if (Array.isArray(allowedRoles)) {
            for (const arole of allowedRoles) {
                if (userRoles.includes(arole)) {
                    return true;
                }
            }
        } else if (typeof allowedRoles === 'string') {
            if (userRoles.includes(allowedRoles)) {
                return true;
            }
        }
    } else {
        return true;
    }
    return false;
};

const isAuth = (allowedRoles?: ROLE | ROLE[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            throw invalidCredentialsError();
        }
        const splitedToken = authHeader.split(' ');
        if (splitedToken.length != 2) {
            throw invalidCredentialsError();
        }

        const token = splitedToken[1];
        try {
            const decodedToken = jwt.verify(token, process.env.TOKEN_SIGN_KEY as Secret) as JwtPayload;

            if (!decodedToken || decodedToken.refresh) {
                throw invalidCredentialsError();
            }

            if (!checkRoles(decodedToken.roles, allowedRoles)) {
                const error = new CustomError();
                error.code = CUSTOM_ERROR_CODES.FORBIDEN;
                error.statusCode = 403;
                throw error;
            }

            const request = <
                {
                    userId: number;
                    userRoles: ROLE[];
                }
            >(<unknown>req);

            request.userId = decodedToken.userId;
            request.userRoles = decodedToken.roles as ROLE[];
            next();
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                const error = new CustomError(err.message);
                error.code = CUSTOM_ERROR_CODES.EXPIRED_TOKEN;
                error.statusCode = 401;
                throw error;
            }
            if (err instanceof JsonWebTokenError || err instanceof NotBeforeError) {
                const error = new CustomError(err.message);
                error.code = CUSTOM_ERROR_CODES.INVALID_TOKEN;
                error.statusCode = 401;
                throw error;
            }
            throw err;
        }
    };
};

const invalidCredentialsError = (): CustomError => {
    const error = new CustomError();
    error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
    error.statusCode = 401;
    return error;
};

export default isAuth;
