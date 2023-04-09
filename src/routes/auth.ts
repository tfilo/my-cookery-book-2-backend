import express from 'express';

import * as authController from '../controllers/auth';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import {
    confirmSchema,
    loginSchema,
    refreshTokenSchema,
    resetPasswordLinkSchema,
    resetPasswordSchema,
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

router.patch('/confirm', validate(confirmSchema), authController.confirmEmail);

router.post('/reset', validate(resetPasswordLinkSchema), authController.resetPasswordLink);

router.patch('/reset', validate(resetPasswordSchema), authController.resetPassword);


router.get('/user', isAuth(), authController.user);

export default router;
