import express from "express";
const app = express();

const hostname = "localhost";
const port = 8017;

app.get("/", (req, res) => {
  res.send("Hello word");
});

app.listen(port, hostname, () => {
  console.log(`listening on port ${hostname}:${port}`);
});
