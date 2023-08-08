import express from "express";
import router from "./router.js";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

// Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "X-CSRFToken, Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "HEAD,OPTIONS,GET,POST,PUT,PATCH,DELETE");

  if (req.method === "OPTIONS") {
    // Return OK response for CORS preflight
    res.json({ message: "Ok" });
  } else {
    next();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use("/v1/", router);

app.get("/", (req, res) => {
  // GCP expects 200 response for root url
  return res.send({message: "Grindery Vector API"});
});

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});

export default app;
