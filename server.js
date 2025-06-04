const http = require("http");
const path = require("path");
const fs = require("fs");

const filePath = path.join(__dirname, "./db/todo.json");
// console.log(filePath);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, World!");
  } else if (pathname === "/todos" && req.method === "GET") {
    const todos = fs.createReadStream(filePath, {
      encoding: "utf-8",
    });

    // check for errors in the stream
    todos.on("error", (err) => {
      console.error("Error reading the file:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });

    todos.on("data", (data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    });
  } else if (pathname === "/todos/create-todo") {
    let data = "";
    req.on("data", (chunk) => {
      data = data + chunk;
    });

    req.on("data", () => {
      // console.log(data);
      // console.log(JSON.parse(data));
      const { title } = JSON.parse(data);
      const id = crypto.randomUUID();
      const createdAt = new Date().toLocaleString();
      const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" })) || [];
      allTodos.push({
        id,
        title,
        createdAt,
      });
      // console.log(allTodos);

      fs.writeFileSync(filePath, JSON.stringify(allTodos, null, 2), "utf-8");
      // console.log(id, title);
      res.writeHead(201, {
        "content-type": "application/json",
      });
      res.end(
        JSON.stringify(
          {
            message: "Todo Created",
            todo: {
              id,
              title,
              createdAt,
            },
          },
          null,
          2
        )
      );
    });

    // res.end("todo created");
  } else if (pathname === "/todo") {
    console.log(url.searchParams.get("id"));
    const id = url.searchParams.get("id");
    if (!id) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Bad Request: Missing id parameter");
      return;
    }

    const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" })) || [];
    const todo = allTodos.find((todo) => todo.id === id);
    if (!todo) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Todo not found");
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todo));
  } else if (pathname === "/todos/update") {
    const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
    const id = url.searchParams.get("id");

    res.end("Update Todo");
  } else {
    res.end("Route not found");
  }
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
