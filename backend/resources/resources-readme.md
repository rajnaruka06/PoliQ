# Resources

This directory contains configuration files, environment variables, and metadata for the application.

## Files

- `.ENV`: Environment variable file (not tracked in version control)
- `.ENV.example`: Example environment file with placeholder values (for documentation purposes)
- `regions.json`: JSON file containing region data
- `datasets.json`: JSON file containing dataset information
- `datasetsVectorDB.json`: JSON file containing dataset embeddings
- `regionsVectorDB.json`: JSON file containing region embeddings

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
- `VECTORDB_CONNECTION_STRING`: Connection string for the vector database
- `VECTORDB_COLLECTION_NAMES`: Comma-separated list of vector database collection names
- `VECTORDB_COLLECTION_NAME_DATASETS`: Name of the datasets collection in the vector database
- `VECTORDB_COLLECTION_NAME_REGIONS`: Name of the regions collection in the vector database

## Metadata Generation

The `ResourceManager` class in `agentHelpers.py` is responsible for generating and managing metadata:
- Creates metadata for regions and datasets from `regions.json` and `datasets.json`
- Saves generated metadata to `metadataRegions.json` and `metadataDatasets.json`
- Uploads resources and metadata to MongoDB collections

## MongoDB Collections

- `Resources`: Main database for storing application resources
  - `metadata`: Collection for storing generated metadata
  - `archive`: Collection for archived resources
  - Other collections named after the resource files

## Usage

The environment variables are loaded using the `python-dotenv` library in various parts of the application. Ensure that all required variables are properly set in the `.ENV` file before running the application.

The `ResourceManager` processes and uploads all resources to MongoDB, making them accessible throughout the application.

## Security Note

Never commit the `.ENV` file to version control. It contains sensitive information and should be kept secure. Use the `.ENV.example` file with placeholder values for documentation purposes.

## Integration with AI Components

The resources in this directory are used by various components in the AI Stuff directory:
- `DatasetRegionMatcher` uses the generated metadata for matching user queries to relevant datasets and regions
- `ElecDataWorkflow` utilizes the database connection information for executing SQL queries
- `ChatHistory` interacts with MongoDB for storing and retrieving chat data and documents

## Updating Resources

When adding new resources or updating existing ones:
1. Place the new/updated files in this directory
2. Run the `processResources` method of `ResourceManager` to update MongoDB with the new data