import express from "express";
import cors from "cors";
import submitRouter from "./routers/submitRouter";
import trainRouter from "./routers/trainRouter";
import resultRouter from "./routers/resultsRouter";
import finishRouter from "./routers/finishRouter";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/submit", submitRouter);
app.use("/train", trainRouter);
app.use("/results", resultRouter);
app.use("/finish", finishRouter);

export default app;
