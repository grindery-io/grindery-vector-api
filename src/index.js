import express from "express";
import router from "./router.js";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

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
