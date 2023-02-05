import Category from '../../models/database/category';

export default async () => {
    const categories: { [key: string]: Category } = {};

    categories.main = await Category.create({
        name: 'Main',
    });

    categories.side = await Category.create({
        name: 'Side-dish',
    });

    return categories;
};
