import { Table, Column, Model, DataType, AllowNull, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';

export interface PictureAttributes {
    id: number;
    sortNumber: number;
    name: string;
    fileName: string;
    recipeId: number | null;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class Picture extends Model<PictureAttributes, Optional<PictureAttributes, 'id' | 'recipeId' | 'createdAt' | 'updatedAt'>> {
    @AllowNull(false)
    @Column({
        type: DataType.INTEGER
    })
    declare sortNumber: number;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(80)
    })
    declare name: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(40)
    })
    declare fileName: string;

    @AllowNull
    @ForeignKey(() => Recipe)
    @Column
    declare recipeId: number;

    @BelongsTo(() => Recipe)
    declare recipe: Recipe;
}

export default Picture;
