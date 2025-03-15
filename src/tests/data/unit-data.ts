import Unit from '../../models/database/unit';
import UnitCategory from '../../models/database/unitCategory';

export default async (unitCategories: { [key: string]: UnitCategory }) => {
    const units: { [key: string]: Unit } = {};

    units.centimeter = await Unit.create({
        name: 'Centimeter',
        abbreviation: 'cm',
        required: true,
        unitCategoryId: unitCategories.length.id!
    });

    units.meter = await Unit.create({
        name: 'Meter',
        abbreviation: 'm',
        required: true,
        unitCategoryId: unitCategories.length.id!
    });

    units.gram = await Unit.create({
        name: 'Gram',
        abbreviation: 'g',
        required: true,
        unitCategoryId: unitCategories.weight.id!
    });

    units.kilogram = await Unit.create({
        name: 'Kilogram',
        abbreviation: 'kg',
        required: true,
        unitCategoryId: unitCategories.weight.id!
    });

    units.dekagram = await Unit.create({
        name: 'Dekagram',
        abbreviation: 'dkg',
        required: true,
        unitCategoryId: unitCategories.weight.id!
    });

    units.asNeeded = await Unit.create({
        name: 'As needed',
        abbreviation: 'a.n.',
        required: false,
        unitCategoryId: unitCategories.other.id!
    });

    return units;
};
