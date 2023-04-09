declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            PORT: number;
            PORT_INTERNAL: number;
            BASE_PATH: string;
            NOTIFICATION_RANGE_DAYS: number;
            INTERNAL_PATH: string;
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
            EMAIL_HOST: string;
            EMAIL_PORT: number;
            EMAIL_USER: string;
            EMAIL_PASS: string;
            EMAIL_FROM: string;
            RESET_LINK_VALIDITY: number;
            MAIL_CONFIRM_SUBJECT: string;
            MAIL_CONFIRM_TEMPLATE_TXT_HBS: string;
            MAIL_CONFIRM_TEMPLATE_HTML_HBS: string;
            MAIL_NOTIFICATION_SUBJECT: string;
            MAIL_NOTIFICATION_TEMPLATE_TXT_HBS: string;
            MAIL_NOTIFICATION_TEMPLATE_HTML_HBS: string;
            MAIL_RESET_SUBJECT: string;
            MAIL_RESET_TEMPLATE_TXT_HBS: string;
            MAIL_RESET_TEMPLATE_HTML_HBS: string;
        }
    }
}
