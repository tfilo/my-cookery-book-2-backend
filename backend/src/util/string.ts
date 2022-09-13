const toSCDF = (value: string) => {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

export default toSCDF;
