import express from "express";
import { publicAuthRouter, protectedAuthRouter } from "./auth.route.js";
import tenantRoute from "./tenant.routes.js";
import userRoute from "./user.routes.js";
import pipelineRoute from "./pipeline.routes.js";
import stageRoute from "./stage.routes.js";
import leadRoute from "./lead.routes.js";
import taskRoutes from './task.routes.js';
import dashboardRoute from './dashboard.routes.js';
import taskCommentsRouter from "./taskComments.routes.js";

const protectedRouter = express.Router();
const unProtectedRouter = express.Router();


// Unprotected Routes
unProtectedRouter.use("/auth", publicAuthRouter);


// Protected Routes
protectedRouter.use("/auth", protectedAuthRouter);
protectedRouter.use("/tenants", tenantRoute);
protectedRouter.use("/user",userRoute);
protectedRouter.use("/pipeline",pipelineRoute);
protectedRouter.use("/stage",stageRoute);
protectedRouter.use("/leads",leadRoute);
protectedRouter.use('/tasks', taskRoutes);
protectedRouter.use("/dashboard",dashboardRoute);
protectedRouter.use("/taskComments",taskCommentsRouter);

export { unProtectedRouter, protectedRouter };