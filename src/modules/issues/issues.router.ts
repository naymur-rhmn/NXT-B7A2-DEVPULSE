import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth.middleware";
import { USER_ROLE } from "../../types";

const router = Router();

router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssue)
router.get("/", issuesController.getAllIssues)
router.get("/:id", issuesController.getSingleIssue)

export const issuesRouter= router;