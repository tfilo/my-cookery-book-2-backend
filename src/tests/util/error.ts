export const processError = async (err: any) => {
    if ('json' in err) {
        return { ...(await err.json()), statusCode: err.status };
    }
    return err;
};
