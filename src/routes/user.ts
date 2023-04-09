import express from 'express';

import * as userController from '../controllers/user';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import {
    createUserSchema,
    deleteUserSchema,
    getUserSchema,
    resentConfirmationSchema,
    updateProfileSchema,
    updateUserSchema,
} from '../schemas/user';

const router = express.Router();

router.get('/', isAuth(ROLE.ADMIN), userController.getUsers);

router.get(
    '/:userId',
    isAuth(ROLE.ADMIN),
    validate(getUserSchema),
    userController.getUser
);

router.post(
    '/',
    isAuth(ROLE.ADMIN),
    validate(createUserSchema),
    userController.createUser
);

router.patch(
    '/resendConfirmation/:userId',
    isAuth(ROLE.ADMIN),
    validate(resentConfirmationSchema),
    userController.resentConfirmation
);

router.patch(
    '/updateProfile',
    isAuth(),
    validate(updateProfileSchema),
    userController.updateUserProfile
);

router.put(
    '/:userId',
    isAuth(ROLE.ADMIN),
    validate(updateUserSchema),
    userController.updateUser
);

router.delete(
    '/:userId',
    isAuth(ROLE.ADMIN),
    validate(deleteUserSchema),
    userController.deleteUser
);

export default router;
