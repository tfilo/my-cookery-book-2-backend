import Picture from '../../models/database/picture';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Recipe from '../../models/database/recipe';

// Directory with files
const pictureDir = process.env.UPLOAD_DIR ?? '/app/uploads';
const thumbnailDir = path.join(pictureDir, 'thumbnail');

export default async (recipes: { [key: string]: Recipe }) => {
    const pictures: { [key: string]: Picture } = {};
    const picture = fs.readFileSync(path.join(__dirname, 'picture.jpg'));
    const thumbnail = fs.readFileSync(path.join(__dirname, 'thumbnail.jpg'));

    const fileUuid1 = uuidv4();
    const fileName1 = `${fileUuid1}.jpg`;

    fs.mkdirSync(pictureDir, { recursive: true });
    fs.mkdirSync(thumbnailDir, { recursive: true });

    fs.writeFileSync(path.join(pictureDir, fileName1), picture);
    fs.writeFileSync(path.join(thumbnailDir, fileName1), thumbnail);

    pictures.sample = await Picture.create({
        fileName: fileName1,
        name: 'test.jpg',
        sortNumber: 1,
        recipeId: recipes.chicken.id
    });

    const fileUuid2 = uuidv4();
    const fileName2 = `${fileUuid2}.jpg`;

    fs.writeFileSync(path.join(pictureDir, fileName2), picture);
    fs.writeFileSync(path.join(thumbnailDir, fileName2), thumbnail);

    pictures.notAssigned = await Picture.create({
        fileName: fileName2,
        name: 'test2.jpg',
        sortNumber: 1
    });

    return pictures;
};
