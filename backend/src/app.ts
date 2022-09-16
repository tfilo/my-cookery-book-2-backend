import fs from 'fs';
import path from 'path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

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

const openapiFilePath = path.join(__dirname, 'openapi.json');
const openapiFile = JSON.parse(fs.readFileSync(openapiFilePath, 'utf-8'));
const basePath = String(process.env.BASE_PATH);

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

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiFile));
router.get('/api-docs/openapi.json', (req, res) => res.json(openapiFile));

router.get('/health', (req, res) => {
    res.send('ok');
});

app.use(basePath, router);

app.use(hasError);
