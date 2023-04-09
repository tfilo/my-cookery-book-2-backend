import * as yup from 'yup';

export const loginSchema = yup
    .object({
        body: yup
            .object({
                username: yup.string().trim().max(50).required(),
                password: yup.string().trim().max(255).required(),
            })
            .required(),
    })
    .required();

export const refreshTokenSchema = yup
    .object({
        body: yup
            .object({
                refreshToken: yup.string().trim().required(),
            })
            .required(),
    })
    .required();

export const updatePasswordSchema = yup
    .object({
        body: yup
            .object({
                password: yup.string().trim().max(255).required(),
                newPassword: yup
                    .string()
                    .trim()
                    .min(8)
                    .max(255)
                    .matches(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                        'simplePassword'
                    )
                    .required(),
            })
            .required(),
    })
    .required();

export const confirmSchema = yup
    .object({
        body: yup
            .object({
                username: yup.string().trim().max(50).required(),
                key: yup.string().trim().uuid().required(),
            })
            .required(),
    })
    .required();

export const resetPasswordLinkSchema = yup
    .object({
        body: yup
            .object({
                email: yup.string().trim().max(320).email().required(),
            })
            .required(),
    })
    .required();

export const resetPasswordSchema = yup
    .object({
        body: yup
            .object({
                username: yup.string().trim().max(50).required(),
                key: yup.string().trim().uuid().required(),
                newPassword: yup
                    .string()
                    .trim()
                    .min(8)
                    .max(255)
                    .matches(
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
                        'simplePassword'
                    )
                    .required(),
            })
            .required(),
    })
    .required();
