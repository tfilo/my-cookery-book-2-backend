declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            PORT: number;
            BASE_PATH: string;
            TOKEN_SIGN_KEY: string;
            TOKEN_VALIDITY: string;
            REFRESH_TOKEN_VALIDITY: string;
            DATABASE_PASSWORD: string;
            DATABASE_USER: string;
            DATABASE: string;
            DATABASE_HOST: string;
            DATABASE_PORT: number;
            DATABASE_LOGGING: boolean;
            LOGGING_ERROR: boolean;
            THUMBNAIL_DIMENSION: number;
            IMAGE_DIMENSION: number;
        }
    }
}
