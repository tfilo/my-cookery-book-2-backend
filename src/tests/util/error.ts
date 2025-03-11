export const processError = async (err: unknown) => {
    if (
        err !== undefined &&
        err !== null &&
        typeof err === 'object' &&
        'json' in err &&
        typeof err.json === 'function' &&
        'status' in err
    ) {
        return { ...(await err.json()), statusCode: err.status };
    }
    return err;
};
