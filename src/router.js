import {Router} from "express";
import embeddings from "./routes/embeddings.js";

const router = Router();

router.use("/embeddings", embeddings);

export default router;
