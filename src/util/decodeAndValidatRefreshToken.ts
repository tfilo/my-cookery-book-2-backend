import jwt, { JsonWebTokenError, JwtPayload, NotBeforeError, Secret, TokenExpiredError } from 'jsonwebtoken';

import CustomError from '../models/customError';
import User from '../models/database/user';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';

const decodeAndValidateRefreshToken = async (token: string) => {
    try {
        const decodedToken = jwt.verify(token, process.env.TOKEN_SIGN_KEY as Secret) as JwtPayload;

        if (!decodedToken || decodedToken.refresh !== true) {
            throw invalidCredentialsError();
        }

        const user = await User.findOne({
            where: {
                id: +decodedToken.userId
            }
        });

        if (!user) {
            throw invalidCredentialsError();
        }

        return +decodedToken.userId;
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

const invalidCredentialsError = (): CustomError => {
    const error = new CustomError();
    error.code = CUSTOM_ERROR_CODES.INVALID_CREDENTIALS;
    error.statusCode = 401;
    return error;
};

export default decodeAndValidateRefreshToken;
