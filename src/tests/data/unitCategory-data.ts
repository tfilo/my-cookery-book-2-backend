import UnitCategory from '../../models/database/unitCategory';

export default async () => {
    const unitCategories: { [key: string]: UnitCategory } = {};
    
    unitCategories.length = await UnitCategory.create({
        name: 'Length',
    });

    unitCategories.weight = await UnitCategory.create({
        name: 'Weight',
    });

    unitCategories.other = await UnitCategory.create({
        name: 'Other',
    });
    
    return unitCategories;
}