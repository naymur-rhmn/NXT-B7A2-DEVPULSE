import express, { type Application } from "express"; 
import { authRouter } from "./modules/auth/auth.route";
import { issuesRouter } from "./modules/issues/issues.router";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(express.json())
app.use(express.text()); 
app.use(express.urlencoded({ extended: true }));
 
app.use("/api/auth", authRouter)
app.use("/api/issues", issuesRouter)




app.get("/", (req, res) => {
    try {
        res.status(200).json({
        success: true,
        message: "Express Server",
    })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Internal server error!",
            error: error,
        })
    }
} )

app.use(globalErrorHandler);

export default app;