import express from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import moment from 'moment';
import { Op } from 'sequelize';
import Handlebars from 'handlebars';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import hasError from './middleware/has-error';
import CustomError from './models/customError';
import Recipe from './models/database/recipe';
import User from './models/database/user';
import { CUSTOM_ERROR_CODES } from './models/errorCodes';
import { sendMail } from './util/email';
import Picture from './models/database/picture';

export const appInternal = express();

const internalPath = String(process.env.INTERNATL_PATH ?? '/internal');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (request, response, next) => {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.TOO_MANY_REQUESTS;
        error.statusCode = 429;
        next(error);
    }
});

appInternal.use(helmet());
appInternal.use(limiter);
appInternal.use(express.json());
appInternal.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    next();
});

const sendNotificationEmail = async (
    username: string,
    email: string,
    recipes: { name: string; id: number }[],
    firstName?: string,
    lastName?: string
) => {
    const emailPlain = process.env.MAIL_NOTIFICATION_TEMPLATE_TXT_HBS!;
    const emailHtml = process.env.MAIL_NOTIFICATION_TEMPLATE_HTML_HBS!;
    const emailSubject = process.env.MAIL_NOTIFICATION_SUBJECT!;

    const emailData = {
        fullName: firstName && lastName ? firstName + ' ' + lastName : username,
        username,
        recipes: recipes
    };

    const compiledPlain = Handlebars.compile(emailPlain)(emailData);
    const compiledHtml = Handlebars.compile(emailHtml)(emailData);

    const emailInfo = await sendMail(email, emailSubject, compiledPlain, compiledHtml);

    if (emailInfo && emailInfo.rejected.length > 0) {
        const error = new CustomError();
        error.code = CUSTOM_ERROR_CODES.UNABLE_TO_SENT_EMAIL;
        error.statusCode = 503;
        throw error;
    }
};

const router = express.Router();

router.post('/sendNotifications', async (req, res) => {
    const recipes = await Recipe.findAll({
        where: {
            createdAt: {
                [Op.gte]: moment()
                    .subtract(+(process.env.NOTIFICATION_RANGE_DAYS ?? 1), 'days')
                    .toDate()
            }
        },
        attributes: ['id', 'name', 'creatorId']
    });

    if (recipes.length > 0) {
        const mappedRecipes = recipes.map((r) => {
            return {
                id: r.id,
                name: r.name,
                creatorId: r.creatorId
            };
        });
        const usersToNotify = await User.findAll({
            where: {
                notifications: true,
                confirmed: true
            },
            attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        });

        for (const user of usersToNotify) {
            // don't send notification about recipes created by notified user
            const filtered = mappedRecipes.filter((r) => r.creatorId !== user.id);

            if (filtered.length > 0) {
                // don't wait for success
                await sendNotificationEmail(user.username, user.email, filtered, user.firstName, user.lastName);
            }
        }
    }

    res.status(204).send();
});

router.get('/health', (req, res) => {
    res.send('ok');
});

router.get('/migrate', async (req, res) => {
    const pictureDir = process.env.UPLOAD_DIR ?? '/app/uploads';
    const thumbnailDir = path.join(pictureDir, 'thumbnail');
    await fs.promises.mkdir(pictureDir, { recursive: true });
    await fs.promises.mkdir(thumbnailDir, { recursive: true });

    const pictures = await Picture.findAll();

    console.log(`Začínam migráciu ${pictures.length} obrázkov...`);

    for (const picture of pictures) {
        
        if (!picture.data || !picture.thumbnail) {
            console.warn(`Obrázok ID ${picture.id} nemá žiadne dáta (null), preskakujem.`);
            continue;
        }

        const fileUuid = uuidv4();
        const fileName = `${fileUuid}.jpg`;

        try {
            await Promise.all([
                fs.promises.writeFile(path.join(pictureDir, fileName), picture.data),
                fs.promises.writeFile(path.join(thumbnailDir, fileName), picture.thumbnail)
            ]);

            picture.fileName = fileName;
            await picture.save();

            console.log(`Spracované: ID ${picture.id} -> ${fileName}`);
        } catch (err) {
            console.error(`Chyba pri ukladaní ID ${picture.id}:`, err);
        }
    }

    res.send('ok');
});

if (process.env.NODE_ENV === 'development') {
    const openapiFilePath = path.join(__dirname, 'openapi-internal.json');
    const openapiFile = JSON.parse(fs.readFileSync(openapiFilePath, 'utf-8'));
    router.get('/api-docs/internal.json', (req, res) => {
        res.json(openapiFile);
    });
    router.use('/api-docs', swaggerUi.serveFiles(openapiFile, {}), swaggerUi.setup(openapiFile));
}

appInternal.use(internalPath, router);

appInternal.use(hasError);
