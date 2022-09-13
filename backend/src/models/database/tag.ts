import {
    Table,
    Column,
    Model,
    DataType,
    AllowNull,
    Unique,
    BelongsToMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';
import RecipeTag from './recipeTag';

interface TagAttributes {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface TagCreationAttributes
    extends Optional<TagAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
    timestamps: true,
})
class Tag extends Model<TagAttributes, TagCreationAttributes> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80),
    })
    name: string;

    @BelongsToMany(() => Recipe, () => RecipeTag)
    recipes: Recipe[];
}

export default Tag;
