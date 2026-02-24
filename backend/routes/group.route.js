import { Router } from "express";

import {
  getAllController,
  getOneController,
  createGroupController,
  addMemberControlller,
  removeMemberControlller,
  joinControlller,
  leaveControlller,
} from "../controllers/group.controller.js";

import auth from "../middlewares/auth.js";

const groupRouter = Router();

groupRouter.get("/", auth, getAllController);
groupRouter.get("/:groupId", auth, getOneController);
groupRouter.post("/", auth, createGroupController);
groupRouter.post("/add-member", auth, addMemberControlller);
groupRouter.delete("/remove-member", auth, removeMemberControlller);
groupRouter.post("/join", auth, joinControlller);
groupRouter.post("/leave", auth, leaveControlller);

export default groupRouter;
