import express from 'express';
import rateLimit from 'express-rate-limit';

import * as authController from '../controllers/auth';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import CustomError from '../models/customError';
import { CUSTOM_ERROR_CODES } from '../models/errorCodes';
import {
    confirmSchema,
    loginSchema,
    refreshTokenSchema,
    resetPasswordLinkSchema,
    resetPasswordSchema,
} from '../schemas/auth';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 10 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next, options) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    },
});

const refreshLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next, options) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    },
});

const confirmAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 10 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next, options) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    },
});

const requestResetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 10 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next, options) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    },
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 10 minutes
    max: 6,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next, options) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    },
});

const router = express.Router();

router.post(
    '/login',
    loginLimiter,
    validate(loginSchema),
    authController.login
);

router.post(
    '/refresh',
    refreshLimiter,
    validate(refreshTokenSchema),
    authController.refreshToken
);

router.patch(
    '/confirm',
    confirmAccountLimiter,
    validate(confirmSchema),
    authController.confirmEmail
);

router.post(
    '/reset',
    requestResetPasswordLimiter,
    validate(resetPasswordLinkSchema),
    authController.resetPasswordLink
);

router.patch(
    '/reset',
    resetPasswordLimiter,
    validate(resetPasswordSchema),
    authController.resetPassword
);

router.get('/user', isAuth(), authController.user);

export default router;
