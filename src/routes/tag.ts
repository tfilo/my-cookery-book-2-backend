import express from 'express';

import * as tagController from '../controllers/tag';
import isAuth from '../middleware/is-auth';
import validate from '../middleware/validate';
import { ROLE } from '../models/roleEnum';
import {
    createTagSchema,
    deleteTagSchema,
    getTagSchema,
    updateTagSchema,
} from '../schemas/tag';

const router = express.Router();

router.get('/', isAuth(), tagController.getTags);

router.get(
    '/:tagId',
    isAuth(ROLE.ADMIN),
    validate(getTagSchema),
    tagController.getTag
);

router.post(
    '/',
    isAuth(ROLE.ADMIN),
    validate(createTagSchema),
    tagController.createTag
);

router.put(
    '/:tagId',
    isAuth(ROLE.ADMIN),
    validate(updateTagSchema),
    tagController.updateTag
);

router.delete(
    '/:tagId',
    isAuth(ROLE.ADMIN),
    validate(deleteTagSchema),
    tagController.deleteTag
);

export default router;
