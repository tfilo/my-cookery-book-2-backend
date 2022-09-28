import express from 'express';

import * as authController from '../controllers/auth';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import {
    loginSchema,
    refreshTokenSchema,
    updatePasswordSchema,
} from '../schemas/auth';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);

router.post(
    '/refresh',
    validate(refreshTokenSchema),
    authController.refreshToken
);

router.patch(
    '/password',
    isAuth(),
    validate(updatePasswordSchema),
    authController.updatePassword
);

router.get('/user', isAuth(), authController.user);

export default router;
