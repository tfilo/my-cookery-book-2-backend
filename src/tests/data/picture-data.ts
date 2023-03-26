import Picture from '../../models/database/picture';
import fs from 'fs';
import path from 'path';
import Recipe from '../../models/database/recipe';

export default async (recipes: { [key: string]: Recipe }) => {
    const pictures: { [key: string]: Picture } = {};
    const picture = fs.readFileSync(path.join(__dirname, 'picture.jpg'));
    const thumbnail = fs.readFileSync(path.join(__dirname, 'thumbnail.jpg'));
    pictures.sample = await Picture.create({
        data: picture,
        thumbnail: thumbnail,
        name: 'test.jpg',
        sortNumber: 1,
        recipeId: recipes.chicken.id,
    });

    return pictures;
};