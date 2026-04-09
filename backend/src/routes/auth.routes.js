import express from "express";

import * as authController from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);
router.put("/change-password", authenticateToken, authController.changePassword);

export default router;
