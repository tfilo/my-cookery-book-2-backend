import { Table, Column, Model, DataType, AllowNull, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';

export interface PictureAttributes {
    id: number;
    sortNumber: number;
    name: string;
    data: Buffer;
    thumbnail: Buffer;
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
        type: DataType.BLOB
    })
    declare data: Buffer;

    @AllowNull(false)
    @Column({
        type: DataType.BLOB
    })
    declare thumbnail: Buffer;

    @AllowNull
    @ForeignKey(() => Recipe)
    @Column
    declare recipeId: number;

    @BelongsTo(() => Recipe)
    declare recipe: Recipe;
}

export default Picture;
