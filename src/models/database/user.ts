import bcrypt from 'bcryptjs';
import {
    Table,
    Column,
    AllowNull,
    Unique,
    Model,
    HasMany,
    DataType,
    DefaultScope,
    Scopes,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Recipe from './recipe';

import UserRole from './userRole';

export interface UserAttributes {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    uuid: string | null;
    confirmed: boolean;
    notifications: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UserCreationAttributes
    extends Optional<
        UserAttributes,
        'id' | 'firstName' | 'lastName' | 'password' | 'createdAt' | 'updatedAt'
    > {}

@DefaultScope(() => ({
    attributes: { exclude: ['password', 'uuid'] },
}))
@Scopes(() => ({
    authScope: {
        attributes: ['id', 'username', 'password', 'confirmed'],
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    },
    confirmScope: {
        attributes: ['id', 'username', 'uuid'],
    },
    listScope: {
        attributes: [
            'id',
            'username',
            'firstName',
            'lastName',
            'confirmed',
            'notifications',
        ],
    },
}))
@Table({
    timestamps: true,
})
class User extends Model<UserAttributes, UserCreationAttributes> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(50),
    })
    username: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(60), // bcryptjs has has 60 characters
    })
    get password(): string {
        return this.getDataValue('password');
    }

    set password(value: string) {
        this.setDataValue('password', bcrypt.hashSync(value, 12));
    }

    @AllowNull(true)
    @Column({
        type: DataType.STRING(50),
    })
    firstName: string;

    @AllowNull(true)
    @Column({
        type: DataType.STRING(50),
    })
    lastName: string;

    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(320),
    })
    email: string;

    @AllowNull
    @Column({
        type: DataType.STRING(36),
    })
    uuid: string | null;

    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    confirmed: boolean;

    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    notifications: boolean;

    @HasMany(() => UserRole)
    roles: UserRole[];

    @HasMany(() => Recipe, {
        foreignKey: 'creatorId',
        onDelete: 'RESTRICT',
    })
    createdRecipes: Recipe[];

    @HasMany(() => Recipe, {
        foreignKey: 'modifierId',
        onDelete: 'RESTRICT',
    })
    updatedRecipes: Recipe[];
}

export default User;
