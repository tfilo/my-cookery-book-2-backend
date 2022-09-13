import {
    Table,
    Column,
    Model,
    HasMany,
    DataType,
    AllowNull,
    Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';

interface CategoryAttributes {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface CategoryCreationAttributes
    extends Optional<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
    timestamps: true,
})
class Category extends Model<CategoryAttributes, CategoryCreationAttributes> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(50),
    })
    name: string;

    @HasMany(() => Recipe, {
        onDelete: 'RESTRICT',
    })
    recipes: Recipe[];
}

export default Category;
