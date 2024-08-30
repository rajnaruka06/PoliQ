# TEAM CH2 POLIQ REPO
## How to use this repo
There are two things for us to set up before we can start the application:
- Front-end setup
- Back-end setup (lots of things to do)
- Starting up the backend

!! Please read everything carefully and go in order of what is written to ensure a smooth setup process !! 
---
### Front-End Requirements

#### Pre-Requisites
Ensure you have this installed on your computer:
- Node.js

Then clone the repo.

#### Install Dependencies
```bash
npm install
```
OR
```bash
npm i
```

This will create a folder called node_modules in the frontend folder.

> ⚠️ Don't Start The App yet!
>
> We still need to setup the backend

---
### Back-End setup

#### Pre-Requisites
We need to install these on your computer:
- PostgreSQL
- MongoDB & mongosh (the mongodb shell)
- Python 3.x and python virtual environment
- .ENV file
- Homebrew (only for mac users)

#### Installing PostgreSQL
1. On Mac use homebrew:
```bash
brew install postgresql
```
then start the servivce with
```bash
brew services start postgresql
```

> ⚠️ If you get an error!
>
> use "brew list" to see which version on postgresql was installed.
> it might be postgresql@14 or @16. If that is the case:
```bash
brew services start postgresql@16
```

2. On Windows:
Download postgresql from this link:
https://www.postgresql.org/download/windows/
During installation *remember* the password you set for the 'postgres' user.
After installation, start postgresql using the pgAdmin tool or from the command line.

#### Set up Postgresql DB (both windows and mac)
1. Start the postgresql interactive terminal 
```bash
psql -U postgres
```

Run the following SQL commands:
```sql
-- Create a user
CREATE USER dummy_user WITH PASSWORD 'dummy_password';

-- Create the databases
CREATE DATABASE polimap_db;
CREATE DATABASE elecdata_db;

-- Grant privileges to the user for both databases
GRANT ALL PRIVILEGES ON DATABASE polimap_db TO dummy_user;
GRANT ALL PRIVILEGES ON DATABASE elecdata_db TO dummy_user;
```

Congratulations, you have set up the postgresql db in the backend!

#### Installing MongoDB
1. On mac use homebrew
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew install mongosh
brew services start mongodb-community@6.0
```

This will install and start up the mongodb service and install the mongodb shell.

2. On windows use this link to download mongodb:
https://www.mongodb.com/try/download/community
^ During the installation select "Install MongoDB as a Service" option.

Then go download MongoSH which is the MongoDB shell:
https://www.mongodb.com/try/download/shell

Then go start MongoDB from the command line or using the MongoDB Compass GUI.

Congratulations you now have MongoDB working!

#### Set up MongoDB
1. Start the mongodb shell
```bash
mongosh
```

2. Type these in to set up your db and credentials:
```js
use ChatHistoryDB

db.createUser({
  user: "myUser",
  pwd: "myPassword",
  roles: [
    {
      role: "readWrite",
      db: "ChatHistoryDB"
    }
  ]
})
```

Verify this was done properly:
```js
db.getUsers()
```

Great now mongoDB is working with your credentials.

#### Create .ENV file
1. Go to your VSCode or Cursor and open the repo up.
2. Go to the Backend folder then go into the resources folder.
3. Create a file called ".ENV". There is a "." at the start of "ENV".
4. Add the following lines to your .ENV file:
```bash
DATABASE_URI=postgresql://dummy_user:dummy_password@localhost:5432/dummy_db
POSTGRES_USER=dummy_user
POSTGRES_PASSWORD=dummy_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POLIMAP_DB_NAME=polimap_db
ELECDATA_DB_NAME=elecdata_db
OPENAI_API_KEY=xxx
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0
LLM_MAX_TOKENS=None
LLM_TIMEOUT=None
LLM_MAX_RETRIES=2
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ChatHistoryDB
CORS_ORIGINS= "http://localhost:5173"


```
5. For the OPENAI_API_KEY, go to this link on next cloud
https://next.poliq.au/apps/collectives/Swinburne/API%20Keys?fileId=949696
^ If this doesn't work go to next cloud > Collectives> Swinburne> Setting up a dev environment. Look for the line that reads "**Note:** Secrets are here". Click on that link and then copy the OPENAI key into your .ENV file.
6. Save the file. Remember, this .ENV is in the AI_Stuff folder in the Backend folder.

#### Set up python virtual environment
1. Navigate back to the backend folder (do this in terminal)
you can use
```bash
cd Backend
```
to get to the backend folder from the root directory.
2. On mac type this in to set up the virtual environment
```bash
python -m venv venv
source venv/bin/activate
```
or if you get an error:
```bash
python3 -m venv venv
source venv/bin/activate
```
3. On windows type this in to set up the virtual environment
```bash
python -m venv venv
.\venv\Scripts\activate
```

4. Once this is done type this in to install all requirements
```bash
pip install -r requirements.txt
```
All the dependencies will be installed.

> ⚠️ If you get an error when running the backend!
>
> some requirements may have been left out of requirements.txt
> just pip install the required libraries if that happens, and please update the requirements.txt file 

---
### Running the App
1. Now that the frontend is setup with npm i and the backend has postgresql and mongodb running, and the .ENV file and virtual environment, we can actually run the app.
2. Start up the backend first. Navigate to the Backend folder with a terminal and type in:
```bash
uvicorn API.main:app --reload
```
This will start a uvicorn app that looks at the API folder and starts up main.py. Note that the folder is called API not api.
You will see a lot of things in the terminal.
3. Open a new terminal and start up the frontend with
```bash
npm run dev
```
4. All done! Enjoy the app!
---
### API Calls
1. You can see how the APIs are running specifically by using an app like RapidAPI or Postman. This is highly recommended so you can see things happening in the backend as the frontend interface is used.

2. If you want to set up the API calls use these parameters in RapidAPI or Postman:


# API
These API calls (that work in postman or rapidAPI) require some information in the mongodb "ChatHistoryDB"

## Requests

### **GET** - /api/chats/all

#### CURL

```sh
curl -X GET "http://127.0.0.1:8000/api/chats/all\
?userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **GET** - /api/chats/66c8154444a13666b4dcefc0/messages

#### CURL

```sh
curl -X GET "http://127.0.0.1:8000/api/chats/66c8154444a13666b4dcefc0/messages\
?userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **POST** - /api/messages/send

#### CURL

```sh
curl -X POST "http://127.0.0.1:8000/api/messages/send\
?userId=example_user_id" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    --data-raw "$body"
```

#### Query Parameters

- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```
- **Content-Type** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

#### Body Parameters

- **body** should respect the following schema:

```
{
  "type": "string",
  "default": "{\n  \"chatId\": \"66c8154444a13666b4dcefc0\",\n\"content\": \"which LLM is this?\"\n  }\n"
}
```

### **GET** - /api/chats/66c8154644a13666b4dcefc3/latest

#### CURL

```sh
curl -X GET "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/latest\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id&limit=2" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```
- **limit** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "2"
  ],
  "default": "2"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc6/pin

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc6/pin\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc3/unpin

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/unpin\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **DELETE** - /api/chats/66c8154644a13666b4dcefc6/delete

#### CURL

```sh
curl -X DELETE "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc6/delete\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc3/archive

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/archive\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc3/unarchive

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/unarchive\
?chatId=66c8154444a13666b4dcefc0&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **chatId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "66c8154444a13666b4dcefc0"
  ],
  "default": "66c8154444a13666b4dcefc0"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **GET** - /api/chats/search

#### CURL

```sh
curl -X GET "http://127.0.0.1:8000/api/chats/search\
?term=project&userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **term** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "project"
  ],
  "default": "project"
}
```
- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc3/title

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/title\
?user_id=example_user_id&newTitle=Updated%20meeting%20notes" \
    -H "Accept: application/json"
```

#### Query Parameters

- **user_id** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```
- **newTitle** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "Updated meeting notes"
  ],
  "default": "Updated meeting notes"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **GET** - /api/chats/66c8154644a13666b4dcefc3/messages/66c8154644a13666b4dcefc5

#### CURL

```sh
curl -X GET "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/messages/66c8154644a13666b4dcefc5\
?userId=example_user_id" \
    -H "Accept: application/json"
```

#### Query Parameters

- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

### **PUT** - /api/chats/66c8154644a13666b4dcefc3/messages/66c8154644a13666b4dcefc5

#### CURL

```sh
curl -X PUT "http://127.0.0.1:8000/api/chats/66c8154644a13666b4dcefc3/messages/66c8154644a13666b4dcefc5\
?userId=example_user_id\
&newContent=Updated%20notes%20after%20the%20recent%20meeting" \
    -H "Accept: application/json"
```

#### Query Parameters

- **userId** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "example_user_id"
  ],
  "default": "example_user_id"
}
```
- **newContent** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "Updated notes after the recent meeting"
  ],
  "default": "Updated notes after the recent meeting"
}
```

#### Header Parameters

- **Accept** should respect the following schema:

```
{
  "type": "string",
  "enum": [
    "application/json"
  ],
  "default": "application/json"
}
```

## References

