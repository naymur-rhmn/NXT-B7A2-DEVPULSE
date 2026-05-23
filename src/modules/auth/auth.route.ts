import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup", authController.userRegistration)

export const authRouter = router;