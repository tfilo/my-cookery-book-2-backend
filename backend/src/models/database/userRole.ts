import {
    AllowNull,
    Column,
    DataType,
    ForeignKey,
    Index,
    Model,
    Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import { ROLE } from '../roleEnum';
import User from './user';

interface UserRoleAttributes {
    id: number;
    roleName: ROLE;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface UserRoleCreationAttributes
    extends Optional<UserRoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
    timestamps: true,
    paranoid: true,
})
class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> {
    @Index({
        name: 'unique-role',
        unique: true,
    })
    @AllowNull(false)
    @Column({
        type: DataType.ENUM(...Object.keys(ROLE)),
    })
    roleName: ROLE;

    @Index({
        name: 'unique-role',
        unique: true,
    })
    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    userId: number;

    @Index({
        name: 'unique-role',
        unique: true,
    })
    @Column({
        type: DataType.DATE,
    })
    deletedAt: Date;
}

export default UserRole;
