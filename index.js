const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//create user API
app.post("/users/", async (request, response) => {
  const { username, password, name, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
        SELECT 
            * 
        FROM 
            user 
        WHERE 
            username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //create user query
    const createUserQuery = `
            INSERT INTO
                user (username, name, password, gender, location)
            VALUES
                (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'  
                );`;
    await db.run(createUserQuery);
    response.send("user created successfully..");
  } else {
    //invalid user
    response.status(400);
    response.send("user already exist");
  }
});

//login user API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT 
            * 
        FROM 
            user 
        WHERE 
            username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (username === undefined){
    response.status(400);
    response.send('Invalid User');
  }else{
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if (isPassword !== true) {
      //send invalid user
      response.status(400);
      response.send("Invalid user password incorrect");
    } else {
      //response login success by comparing password
      response.send("Login success");
    }
  }
  
});
