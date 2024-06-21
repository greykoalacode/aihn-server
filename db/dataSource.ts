// import dotenv from "dotenv";

// dotenv.config();

import prodConnectionOptions from "./dataSourceProd";
import localConnectionOptions from "./dataSourceLocal";
import { DataSource } from "typeorm";

export const AppDataSource: DataSource =  process.env.NODE_ENV === "production"
  ? new DataSource({
    ...prodConnectionOptions,
  })
  : new DataSource({
    ...localConnectionOptions,
  });


// export const AppDataSource = new DataSource({
//     type: "postgres",
//     host: "localhost",
//     port: 5432,
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: "aihn",
//     synchronize: true,
//     logging: false,
//     entities: [__dirname+"/entities/*.ts"],
//     subscribers: [],
//     migrations: [__dirname+"/entities/*.ts"],
// });