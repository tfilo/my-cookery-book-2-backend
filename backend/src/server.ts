import 'dotenv/config';

import { app } from './app';
import sequelize from './util/database';

const port = process.env.PORT || 3000;

(async () => {
    await sequelize.sync();

    // TODO base user for development

    app.listen(port, () => console.info(`Server running on port ${port}`));
})();
