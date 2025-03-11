import Tag from '../../models/database/tag';

export default async () => {
    const tags: { [key: string]: Tag } = {};

    tags.meat = await Tag.create({
        name: 'Meat'
    });

    tags.vegetarian = await Tag.create({
        name: 'Vegetarian'
    });

    return tags;
};
