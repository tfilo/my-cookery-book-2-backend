import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { ValidationError } from 'yup';

import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';

// Workaround to make req.query writable again after validation, because Express marks it as read-only
const updateQuery = (req: Request, value: unknown) => {
    Object.defineProperty(req, 'query', {
        ...Object.getOwnPropertyDescriptor(req, 'query'),
        writable: false,
        value
    });
};

const validate = (yupSchema: yup.InferType<yup.AnySchema>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const afterValidation = await yupSchema.validate(
                {
                    body: req.body,
                    query: req.query,
                    params: req.params
                },
                {
                    abortEarly: false,
                    stripUnknown: true
                }
            );

            req.body = afterValidation.body;
            updateQuery(req, afterValidation.query);
            req.params = afterValidation.params;

            next();
        } catch (err) {
            const fields: { [field: string]: string } = {};
            if (err instanceof ValidationError && err.inner.length > 0) {
                for (const inner of err.inner) {
                    if (inner.path && inner.message) {
                        const path = inner.path
                            .replace(/^(body\.)/, '')
                            .replace(/^(query\.)/, '')
                            .replace(/^(params\.)/, '');
                        fields[path] = inner.message;
                    }
                }
            }
            const error = new CustomError();
            error.code = CUSTOM_ERROR_CODES.VALIDATION_FAILED;
            error.statusCode = 422;
            error.fields = fields;
            next(error);
        }
    };
};

export default validate;
