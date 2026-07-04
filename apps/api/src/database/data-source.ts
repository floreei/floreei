import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { buildDataSourceOptions } from "./typeorm.config";

dotenv.config({ path: [".env.local", ".env"] });

/** DataSource usado pela CLI do TypeORM (migrations) e pelo seed. */
const dataSource = new DataSource(buildDataSourceOptions());

export default dataSource;
