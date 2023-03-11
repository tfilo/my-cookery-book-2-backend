import UnitCategory from '../../models/database/unitCategory';

export default async () => {
    const unitCategories: { [key: string]: UnitCategory } = {};
    
    unitCategories.length = await UnitCategory.create({
        name: 'Length',
    });

    unitCategories.other = await UnitCategory.create({
        name: 'Other',
    });

    unitCategories.weight = await UnitCategory.create({
        name: 'Weight',
    });
    
    return unitCategories;
}