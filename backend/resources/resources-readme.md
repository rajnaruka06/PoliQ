# Resources

This directory contains configuration files and environment variables for the application.

## Files

- `.ENV`: Environment variable file (not tracked in version control)
- `.ENV.example`: Example environment file with placeholder values (for documentation purposes)

## Environment Variables

The `.ENV` file should contain the following variables:
- `OPENAI_API_KEY`: API Key for OPENAI Large Language Model
- `ELECDATA_DB_NAME`: Name of the electoral data database
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_HOST`: PostgreSQL host address
- `POSTGRES_PORT`: PostgreSQL port
- `MONGO_URI`: MongoDB connection URI
- `MONGO_DB_NAME`: MongoDB database name
- `CONTEXT_TOKEN_LIMIT`: Token limit for recent messages context (default: 4096)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

## Usage

The environment variables are loaded using the `python-dotenv` library in various parts of the application. Ensure that all required variables are properly set in the `.ENV` file before running the application.

## Security Note

Never commit the `.ENV` file to version control. It contains sensitive information and should be kept secure. Use the `.ENV.example` file with placeholder values for documentation purposes.