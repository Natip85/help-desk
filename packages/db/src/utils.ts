import type { PgTimestampConfig } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, pgTableCreator, timestamp } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name: string) => `${name}`);

export const timestampSettings: PgTimestampConfig = {
  mode: "date",
  withTimezone: true,
};

export const currentTimestamp = sql`CURRENT_TIMESTAMP`;

export const createTimestampColumn = (name: string) => timestamp(name, timestampSettings);

export const createUpdateTimestamps = {
  createdAt: createTimestampColumn("created_at").default(currentTimestamp).notNull(),
  updatedAt: createTimestampColumn("updated_at").$onUpdate(() => new Date()),
};

export const featureVersion = <T extends number | null>(name: string) =>
  numeric(name + "_version", { precision: 6, scale: 3, mode: "number" }).$type<T>();
