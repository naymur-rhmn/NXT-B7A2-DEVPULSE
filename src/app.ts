import express, { type Application } from "express"; 
import { authRouter } from "./modules/auth/auth.route";

const app: Application = express();

app.use(express.json())
app.use(express.text()); 
app.use(express.urlencoded({ extended: true }));
 
app.use("/api/auth", authRouter)




app.get("/", (req, res) => {
    try {
        res.status(200).json({
        success: true,
        message: "Express Server",
        api_endpoint: {
            user_registration: "/api/auth/signup",
            user_login: "/api/auth/login",
            create_issue: "/api/issues",
            all_issues: "/api/issues?sort=newest",
            single_issue: "/api/issues/:id",
            update_issue: "/api/issues/:id",
            delete_issue: "/api/issues/:id"
        }
    })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Internal server error!",
            error: error,
        })
    }
} )

export default app;