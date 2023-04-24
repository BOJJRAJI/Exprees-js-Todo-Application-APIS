const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//API1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%' AND 
          status='${status}' and priority='${priority}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%' AND 
          status='${status}' ;`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%' AND 
           priority='${priority}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE 
          todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoDataQuery = `
SELECT * FROM todo where id=${todoId}
`;

  const todoData = await db.get(getTodoDataQuery);
  response.send(todoData);
});

//API3
app.post("/todos/", async (request, response) => {
  console.log(request.body);
  const { id, todo, priority, status } = request.body;

  const addTodoDataQuery = `
INSERT INTO todo (id,todo,priority,status)
VALUES (
${id},'${todo}','${priority}','${status}'
)
`;

  await db.run(addTodoDataQuery);
  response.send("Todo Successfully Added");
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API5 DELETE TODO
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoDataQuery = `
DELETE FROM todo where id=${todoId}
`;

  await db.run(deleteTodoDataQuery);
  response.send("Todo Deleted");
});

module.exports = app;
