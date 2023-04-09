import fs from 'fs';
import path from 'path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';

import './yup-config';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/category';
import pictureRoutes from './routes/picture';
import recipeRoutes from './routes/recipe';
import tagRoutes from './routes/tag';
import unitRoutes from './routes/unit';
import unitCategoryRoutes from './routes/unitCategory';
import userRoutes from './routes/user';
import hasError from './middleware/has-error';

export const app = express();

const basePath = String(process.env.BASE_PATH ?? '/api');

app.use(helmet());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    next();
});

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/category', categoryRoutes);
router.use('/picture', pictureRoutes);
router.use('/recipe', recipeRoutes);
router.use('/tag', tagRoutes);
router.use('/unit', unitRoutes);
router.use('/unitCategory', unitCategoryRoutes);
router.use('/user', userRoutes);

router.get('/health', (req, res) => {
    res.send('ok');
});

if (process.env.NODE_ENV === 'development') {
    const openapiFilePath = path.join(__dirname, 'openapi.json');
    const openapiFile = JSON.parse(fs.readFileSync(openapiFilePath, 'utf-8'));
    router.get('/api-docs/public.json', (req, res) => res.json(openapiFile));
    const options = {
        explorer: true,
        swaggerOptions: {
            urls: [
                {
                    url: basePath + '/api-docs/public.json',
                    name: 'Public API',
                },
            ],
        },
    };
    router.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(undefined, options)
    );
}

app.use(basePath, router);

app.use(hasError);
