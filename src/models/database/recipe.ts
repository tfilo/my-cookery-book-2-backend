import { Table, Column, Model, HasMany, DataType, AllowNull, Unique, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Category from './category';
import RecipeSection from './recipeSection';
import Picture from './picture';
import RecipeTag from './recipeTag';
import Tag from './tag';
import User from './user';
import RecipeRecipe from './recipeRecipe';

export interface RecipeAttributes {
    id: number;
    name: string;
    nameSearch: string | null;
    description: string | null;
    descriptionSearch: string | null;
    serves: number | null;
    method: string | null;
    sources: string[];
    categoryId: number;
    modifierId: number;
    creatorId: number;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class Recipe extends Model<
    RecipeAttributes,
    Optional<RecipeAttributes, 'id' | 'nameSearch' | 'description' | 'descriptionSearch' | 'serves' | 'method' | 'createdAt' | 'updatedAt'>
> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80)
    })
    declare name: string;

    @AllowNull
    @Column({
        type: DataType.STRING(80)
    })
    declare nameSearch: string;

    @AllowNull
    @Column({
        type: DataType.STRING(160)
    })
    declare description: string | null;

    @AllowNull
    @Column({
        type: DataType.STRING(160)
    })
    declare descriptionSearch: string;

    @AllowNull
    @Column({
        type: DataType.INTEGER
    })
    declare serves: number;

    @AllowNull
    @Column({
        type: DataType.TEXT
    })
    declare method: string;

    @AllowNull(false)
    @Column({
        type: DataType.ARRAY(DataType.STRING(1000))
    })
    declare sources: string[];

    @AllowNull(false)
    @ForeignKey(() => Category)
    @Column
    declare categoryId: number;

    @BelongsTo(() => Category)
    category: Category;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    declare creatorId: number;

    @BelongsTo(() => User, 'creatorId')
    declare creator: User;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    declare modifierId: number;

    @BelongsTo(() => User, 'modifierId')
    declare modifier: User;

    @HasMany(() => RecipeSection, {
        onDelete: 'CASCADE'
    })
    declare recipeSections: RecipeSection[];

    @BelongsToMany(() => Recipe, () => RecipeRecipe, 'recipeId', 'associatedRecipeId')
    declare associatedRecipes: Array<Recipe & { RecipeRecipe: RecipeRecipe }>;

    @BelongsToMany(() => Tag, () => RecipeTag)
    declare tags: Array<Tag & { RecipeTag: RecipeTag }>;

    @HasMany(() => Picture, {
        onDelete: 'CASCADE'
    })
    declare pictures: Picture[];
}

export default Recipe;
