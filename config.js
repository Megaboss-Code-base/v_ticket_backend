require('dotenv').config();
const { URL } = require('url');
const path = require('path');

// Helper function to parse the database URL and extract components
function extractDbConfig(connectionString) {
  console.log('Parsing connection string:', connectionString); // Debugging log

  // Remove query parameters for SSL handling
  const cleanedConnectionString = connectionString.split('?')[0];

  // Use URL to parse components
  const { hostname: host, port, pathname, username, password } = new URL(cleanedConnectionString);

  // Get database name from the path (strip leading '/')
  const database = pathname.slice(1);

  return {
    username,
    password,
    host,
    port,
    database,
  };
}

// Extract the database URL (without query parameters)
const dbConnectionString = process.env.DBCONNECTION_STRING;

if (!dbConnectionString) {
  throw new Error('DBCONNECTION_STRING is not defined in the environment variables');
}

// Parse the config
const dbConfig = extractDbConfig(dbConnectionString);
console.log('Extracted DB Config:', dbConfig);  // Debugging log

module.exports = {
  development: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    port: dbConfig.port || 5432, // Default to 5432 if not specified
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
    migrations: [path.resolve(__dirname, 'src/migrations/*.ts')], // Correct path for migrations
  },
  production: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    host: dbConfig.host,
    port: dbConfig.port || 5432,  // Default to 5432 if not specified
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,  // Enable SSL connection
        rejectUnauthorized: false,  // Disable certificate validation
      },
    },
    migrations: [path.resolve(__dirname, 'src/migrations/*.ts')], // Correct path for migrations
  },
};
