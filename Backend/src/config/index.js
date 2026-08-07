import { Sequelize } from 'sequelize';
import pg from 'pg'; // 1. Import pg directly so Vercel bundles it
import { env } from '../config/env.js';

const isProduction = process.env.NODE_ENV === 'production';

export const sequelize = env.databaseUrl
  ? new Sequelize(env.databaseUrl, {
      dialect: 'postgres',
      dialectModule: pg, // 2. Pass pg explicitly to Sequelize
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon PostgreSQL
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        dialectModule: pg, // Pass pg explicitly here too
        port: process.env.DB_PORT || 5432,
      }
    );