import {
    Table,
    Column,
    Model,
    DataType,
    AllowNull,
    BelongsTo,
    ForeignKey,
} from 'sequelize-typescript';
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

interface PictureCreationAttributes
    extends Optional<
        PictureAttributes,
        'id' | 'recipeId' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class Picture extends Model<PictureAttributes, PictureCreationAttributes> {
    @AllowNull(false)
    @Column({
        type: DataType.INTEGER,
    })
    sortNumber: number;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(80),
    })
    name: string;

    @AllowNull(false)
    @Column({
        type: DataType.BLOB,
    })
    data: Buffer;

    @AllowNull(false)
    @Column({
        type: DataType.BLOB,
    })
    thumbnail: Buffer;

    @AllowNull
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @BelongsTo(() => Recipe)
    recipe: Recipe;
}

export default Picture;
