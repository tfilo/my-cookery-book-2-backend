import 'dotenv/config';

import { app } from './app';
import User from './models/database/user';
import UserRole from './models/database/userRole';
import { ROLE } from './models/roleEnum';
import sequelize from './util/database';

const port = process.env.PORT || 8080;

(async () => {
    if (process.env.NODE_ENV === 'development') {
        await sequelize.sync();

        const [user, created] = await User.findOrCreate({
            where: {
                username: 'Test',
            },
            defaults: {
                username: 'Test',
                password: 'Test1234',
            },
        });
        if (created) {
            await UserRole.findOrCreate({
                where: {
                    userId: user.id,
                    roleName: ROLE.ADMIN,
                },
            });
        }
    } else {
        // just check database
        await sequelize.sync({
            force: false,
            alter: false,
        });
    }
    app.listen(port, () => console.info(`Server running on port ${port}`));
})();
