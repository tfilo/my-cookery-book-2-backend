const toSCDF = (value: string | null) => {
    if (!value) {
        return '';
    }
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

export default toSCDF;
