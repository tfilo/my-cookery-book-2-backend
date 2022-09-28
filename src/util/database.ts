import path from 'path';
import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
    database: process.env.DATABASE,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: (process.env.DATABASE_PORT ?? 5432) as number,
    models: [path.join(__dirname, '..', 'models', 'database')],
    logging: process.env.DATABASE_LOGGING === 'false' ? false : console.log,
});

export default sequelize;
