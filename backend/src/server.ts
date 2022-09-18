import 'dotenv/config';

import { app } from './app';
import sequelize from './util/database';

const port = process.env.PORT || 3000;

(async () => {
    if (process.env.NODE_ENV === 'development') {
        await sequelize.sync();
    }

    app.listen(port, () => console.info(`Server running on port ${port}`));
})();
