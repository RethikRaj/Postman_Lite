import express from "express";
import cors from "cors";
import { executeProxyRequest } from "./proxyExceutor.js";

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

app.post("/api/proxy", async (req, res) => {
    const { method, url, headers, bodyMode, body, formFields } = req.body || {};

    if (!method || typeof method !== "string") {
        return res.status(400).json({
        success: false,
        errorType: "INVALID_URL",
        message: "Missing or invalid 'method'",
        });
    }
    if (!url || typeof url !== "string") {
        return res.status(400).json({
        success: false,
        errorType: "INVALID_URL",
        message: "Missing or invalid 'url'",
        });
    }

    const result = await executeProxyRequest({
        method: method.toUpperCase(),
        url,
        headers: headers || {},
        bodyMode: bodyMode || "none",
        body,
        formFields,
    });

    // Proxy-level failures return 200 with success:false so the frontend
    // can always read the JSON body consistently (no need to branch on HTTP status
    // for proxy-vs-target failures).
    res.status(200).json(result);
});


