 
            import { createRequire } from 'module'; 
            const require = createRequire(import.meta.url); 
            

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  port: process.env.PORT,
  connection_url: process.env.CONNECTION_STRING,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_url
});
var initDB = async () => {
  try {
    await pool.query(`
                CREATE TABLE IF NOT EXISTS users(
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,

                    email VARCHAR(50) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role VARCHAR(20) DEFAULT 'contributor',
                    
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR(300) NOT NULL,

                description TEXT NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),

                reporter_id INT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW() 
                )
            `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Failed to connect database:", error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var userRegisterIntoDB = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING *
        `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var userloginFromDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
        SELECT * FROM users WHERE email=$1
        `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid Credentials!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwt_secret, { expiresIn: "1d" });
  delete user.password;
  return {
    token: accessToken,
    user
  };
};
var authService = {
  userRegisterIntoDB,
  userloginFromDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var userRegistration = async (req, res) => {
  try {
    const result = await authService.userRegisterIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error.message,
      error
    });
  }
};
var userLogin = async (req, res) => {
  try {
    const result = await authService.userloginFromDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  userRegistration,
  userLogin
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.userRegistration);
router.post("/login", authController.userLogin);
var authRouter = router;

// src/modules/issues/issues.router.ts
import { Router as Router2 } from "express";

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};
var ISSUE_TYPE = {
  bug: "bug",
  feature_request: "feature_request"
};
var ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved"
};
var ISSUE_SORT = {
  newest: "newest",
  oldest: "oldest"
};

// src/modules/issues/issues.service.ts
var createIssuesIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  console.log(reporter_id);
  const issue = await pool.query(`
            INSERT INTO issues(title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
        `, [title, description, type, reporter_id]);
  return issue;
};
var getAllIssuesFromDB = async (filter) => {
  const { sort, type, status } = filter;
  let queryString = `SELECT * FROM issues`;
  const condition = [];
  const values = [];
  if (type === ISSUE_TYPE.bug || type === ISSUE_TYPE.feature_request) {
    condition.push(`type = $${values.length + 1}`);
    values.push(type);
  }
  if (status && status === ISSUE_STATUS.open || status === ISSUE_STATUS.in_progress || status === ISSUE_STATUS.resolved) {
    condition.push(`type = $${values.length + 1}`);
    values.push(status);
  }
  if (condition.length > 0) {
    queryString = queryString + ` WHERE ` + condition.join(" AND ");
  }
  if (sort === ISSUE_SORT.newest) {
    queryString += ` ORDER BY created_at ASC`;
  } else if (sort === ISSUE_SORT.oldest) {
    queryString += ` ORDER BY created_at DESC`;
  }
  const issueResult = await pool.query(queryString, values);
  const issues = issueResult.rows;
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const users = usersResult.rows;
  const userMap = new Map(users.map((user) => [user.id, user]));
  const result = issues.map((issue) => {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: userMap.get(issue.reporter_id) || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return result;
};
var getSingleIssueFromDB = async (id) => {
  const res = await pool.query(`
            SELECT * FROM issues WHERE id=$1
        `, [id]);
  const issue = res.rows[0];
  const reporterId = issue.reporter_id;
  const userResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id=$1
    `,
    [reporterId]
  );
  const users = userResult.rows[0];
  const result = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: { ...users },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return result;
};
var updateIssueIntoDB = async (payload, id) => {
  const { title, description, type, status } = payload;
  console.log(title);
  const issue = await pool.query(`
            UPDATE issues SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            type=COALESCE($3, type), 
            status=COALESCE($4, status) 
            WHERE id=$5 RETURNING *
        `, [title, description, type, status, id]);
  return issue;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(`
            DELETE FROM issues WHERE id=$1
        `, [id]);
  return result;
};
var issuesService = {
  createIssuesIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporter_id = req.user?.id;
    const payload = {
      ...req.body,
      reporter_id
    };
    const result = await issuesService.createIssuesIntoDB(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issuesService.getAllIssuesFromDB(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Data retrieved Successfully!",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await issuesService.getSingleIssueFromDB(req.params.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Data retrived successfull",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issuesService.updateIssueIntoDB(req.body, req.params.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Update Successfull",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const result = await issuesService.deleteIssueFromDB(req.params.id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error.message
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = jwt2.verify(token, config_default.jwt_secret);
      const result = await pool.query(`
        SELECT id, name,  email, role FROM users WHERE id=$1
        `, [decoded.id]);
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden access!"
        });
      }
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_middleware_default = auth;

// src/middleware/updateIssue.middleware.ts
import "jsonwebtoken";

// src/utility/jwtVerify.ts
import jwt3 from "jsonwebtoken";
var jwtVerify = (token, secret) => {
  return jwt3.verify(token, secret);
};
var jwtVerify_default = jwtVerify;

// src/middleware/updateIssue.middleware.ts
var updateIssue2 = async (req, res, next) => {
  try {
    console.log("first");
    const { id } = req.params;
    const token = req.headers.authorization;
    const issue = await issuesService.getSingleIssueFromDB(id);
    if (!issue) {
      throw new Error("not found");
    }
    if (!token) {
      throw new Error("token undefined");
    }
    const decoded = jwtVerify_default(token, config_default.jwt_secret);
    if (!decoded) {
      throw new Error("unauthorized");
    }
    if (decoded.role === USER_ROLE.maintainer) {
      return next();
    }
    if (decoded.role === USER_ROLE.contributor) {
      const isOwner = issue.reporter?.id === req.user?.id;
      const isOpen = issue.status === "open";
      if (isOwner && isOpen) {
        return next();
      }
      return res.status(403).json({ message: "Not allowed to update the issue" });
    }
  } catch (error) {
    next(error);
  }
};
var updateIssue_middleware_default = updateIssue2;

// src/middleware/gurad.middleware.ts
var guard = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }
    const decoded = jwtVerify_default(token, config_default.jwt_secret);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    if (decoded.role !== USER_ROLE.maintainer) {
      return res.status(403).json({
        success: false,
        message: "Only maintainer can delete issue"
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
var gurad_middleware_default = guard;

// src/modules/issues/issues.router.ts
var router2 = Router2();
router2.post("/", auth_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch(
  "/:id",
  auth_middleware_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  updateIssue_middleware_default,
  issuesController.updateIssue
);
router2.delete("/:id", gurad_middleware_default, issuesController.deleteIssue);
var issuesRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/issues", issuesRouter);
app.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Express Server"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error!",
      error
    });
  }
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log("The server is lestening on port: ", config_default.port);
  });
};
main();
//# sourceMappingURL=server.js.map