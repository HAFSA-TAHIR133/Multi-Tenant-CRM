require("dotenv").config({ path: "./.env" });

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false, // Required for Neon cloud connections
  },
};

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
};




// require("dotenv").config({
//   path: "./.env",
// });

// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
// console.log("DB_NAME:", process.env.DB_NAME);

// module.exports = {
//   development: {
//     username: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//     port: 5432,
//   },

//   test: {
//     username: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//     port: 5432,
//   },

//   production: {
//     username: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     dialect: "postgres",
//     port: 5432,
//   },
// };


// const pool = new Pool({
//   connectionString:process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === "production"?{rejectUnauthorized:false}:false,
// })

// export default pool;