import { CUSTOM_ERROR_CODES } from './errorCodes';

class CustomError extends Error {
    statusCode = 500;
    code?: CUSTOM_ERROR_CODES;
    fields?: { [field: string]: string };
}

export default CustomError;
