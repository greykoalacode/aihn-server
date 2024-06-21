import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";

import dotenv from "dotenv";
import { log } from "console";

dotenv.config();


let localConnectionOptions: DataSourceOptions = {
  type: "postgres", // It could be mysql, mongo, etc
  host: "localhost",
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: "aihn",
  synchronize: false, // if true, you don't really need migrations
  logging: true,
  entities: [__dirname+"../../entities/*.ts"], // where our entities reside
  migrations: [__dirname+"/db/migrations/*.ts"], // where our migrations reside
  migrationsRun: true
};


// export default new DataSource({...localConnectionOptions});
export default localConnectionOptions;