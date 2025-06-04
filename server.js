// Import required Node.js core modules
const http = require("http"); // For creating HTTP server
const path = require("path"); // For handling file paths
const fs = require("fs"); // For file system operations
const crypto = require("crypto"); // For generating unique IDs

// Define the path to the JSON file that will store our todos
const filePath = path.join(__dirname, "./db/todo.json");
// console.log(filePath);

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Parse the URL from the request
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Route 1: Home route - returns a simple greeting
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello, World!");
  }
  // Route 2: GET all todos
  else if (pathname === "/todos" && req.method === "GET") {
    const todos = fs.createReadStream(filePath, {
      encoding: "utf-8",
    });

    // check for errors in the stream
    todos.on("error", (err) => {
      console.error("Error reading the file:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });

    // Send todos data as JSON response when data is available
    todos.on("data", (data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    });
  }
  // Route 3: Create a new todo
  else if (pathname === "/todos/create-todo" && req.method === "POST") {
    let data = "";
    // Collect data chunks from the request body
    req.on("data", (chunk) => {
      data = data + chunk;
    });

    // Process the complete data once all chunks are received
    req.on("end", () => {
      // Parse the JSON data from the request
      const { title } = JSON.parse(data);

      // Generate a unique ID and timestamp for the new todo
      const id = crypto.randomUUID();
      const createdAt = new Date().toLocaleString();

      // Read existing todos from file
      const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" })) || [];

      // Add the new todo to the array
      allTodos.push({
        id,
        title,
        createdAt,
      });

      // Save the updated todos array back to the file
      fs.writeFileSync(filePath, JSON.stringify(allTodos, null, 2), "utf-8");

      // Send a successful response with the newly created todo
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
  }
  // Route 4: Get a specific todo by ID
  else if (pathname === "/todo" && req.method === "GET") {
    // Extract the todo ID from the URL query parameters
    console.log(url.searchParams.get("id"));
    const id = url.searchParams.get("id");

    // Validate that ID parameter exists
    if (!id) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Bad Request: Missing id parameter");
      return;
    }

    // Read all todos from the file
    const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" })) || [];

    // Find the specific todo with the matching ID
    const todo = allTodos.find((todo) => todo.id === id);

    // Return 404 if todo with specified ID doesn't exist
    if (!todo) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Todo not found");
      return;
    }

    // Return the found todo as JSON
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todo));
  }
  // Route 5: Update an existing todo
  else if (pathname === "/todos/update" && req.method === "PATCH") {
    // Read all todos from the file
    const allTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));

    // Extract the todo ID from the URL query parameters
    const id = url.searchParams.get("id");

    // Validate that ID parameter exists
    if (!id) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Bad Request: Missing id parameter");
      return;
    }

    // Find the specific todo with the matching ID
    const todo = allTodos.find((todo) => todo.id === id);

    // Return 404 if todo with specified ID doesn't exist
    if (!todo) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Todo not found");
      return;
    }

    // Collect data chunks from the request body
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });

    // Process the complete data once all chunks are received
    req.on("end", () => {
      // Parse the JSON data and update the todo title
      const { title } = JSON.parse(data);
      todo.title = title;
      console.log(allTodos);

      // Save the updated todos array back to the file
      fs.writeFileSync(filePath, JSON.stringify(allTodos, null, 2), "utf-8");

      // Send a successful response with the updated todo
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ message: "Todo updated", todo }, null, 2));
    });
  }
  // Default route - handle undefined routes
  else if (pathname === "/todos/delete" && req.method === "DELETE") {
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Bad Request: Missing id parameter");
      return;
    }

    const getAllTodos = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" })) || [];

    const todoToDelete = getAllTodos.find((todo) => todo.id === id);

    if (!todoToDelete) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Todo not found");
      return;
    }

    // Filter out the todo to delete
    const updatedTodos = getAllTodos.filter((todo) => todo.id !== id);
    // Save the updated todos array back to the file
    fs.writeFileSync(filePath, JSON.stringify(updatedTodos, null, 2), "utf-8");

    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify({ message: "Todo deleted successfully" }, null, 2));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Route not found");
  }
});

// Start the server and listen on port 5000
server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
