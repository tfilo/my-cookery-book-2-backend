import User from '../../models/database/user';
import UserRole from '../../models/database/userRole';
import { ROLE } from '../../models/roleEnum';

export default async () => {
    const users: { [key: string]: User } = {};

    users.admin = await User.create({
        username: 'admin',
        firstName: 'Best',
        lastName: 'Admin',
        password: 'Admin123',
    });

    await UserRole.create({
        userId: users.admin.id,
        roleName: ROLE.ADMIN,
    });

    users.creator = await User.create({
        username: 'creator',
        password: 'Creator123',
    });

    await UserRole.create({
        userId: users.creator.id,
        roleName: ROLE.CREATOR,
    });

    users.simple = await User.create({
        username: 'simple',
        password: 'Simple123',
    });

    users.admin = (await User.findByPk(users.admin.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    users.creator = (await User.findByPk(users.creator.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    users.simple = (await User.findByPk(users.simple.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    return users;
};
