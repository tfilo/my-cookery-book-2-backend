import * as yup from 'yup';

yup.setLocale({
    mixed: {
        required: 'required',
        notType: 'invalidValue',
        oneOf: ({ values }) => ({
            key: 'allowed',
            values: { values },
        }),
        defined: 'defined',
    },
    string: {
        max: ({ max }) => ({
            key: 'maxLength',
            values: { max },
        }),
        min: ({ min }) => ({
            key: 'minLength',
            values: { min },
        }),
        email: 'email',
        uuid: 'uuid',
    },
    number: {
        max: ({ max }) => ({
            key: 'max',
            values: { max },
        }),
        min: ({ min }) => ({
            key: 'min',
            values: { min },
        }),
    },
});
