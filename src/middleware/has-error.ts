import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'sequelize';

import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';

const hasError = (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(error);
    }
    if (process.env.LOGGING_ERROR !== 'false') console.error(error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        res.status(409).json({
            code: CUSTOM_ERROR_CODES.CONSTRAINT_FAILED
        });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
        const mappedErrors: { [field: string]: string } = {};
        (error as ValidationError).errors.forEach((vei) => {
            if (vei !== null && vei.path && vei.validatorKey) {
                mappedErrors[vei.path] = vei.validatorKey;
            }
        });
        res.status(409).json({
            code: CUSTOM_ERROR_CODES.UNIQUE_CONSTRAINT_ERROR,
            fields: mappedErrors
        });
    } else if (error instanceof CustomError) {
        const status = error?.statusCode || 500;
        res.status(status).json({
            message: error.message,
            code: error.code,
            fields: error.fields
        });
    } else {
        res.status(500).json({ code: CUSTOM_ERROR_CODES.GENERAL_ERROR });
    }
};

export default hasError;
