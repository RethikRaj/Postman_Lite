import express from "express";
import cors from "cors";

export const app = express();

// Only allow our own frontend's origin to call this API.
// Set FRONTEND_ORIGIN in env when deploying (e.g. https://your-app.vercel.app).
// Falls back to common local dev ports if not set.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({
    origin: FRONTEND_ORIGIN
}));

app.use(express.json({ limit: "10mb" }));

app.get("/ping", (req, res) => {
    res.json({ status: "pong" });
});


