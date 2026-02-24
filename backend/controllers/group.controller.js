import crypto from "crypto";
import mongoose from "mongoose";

import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import { group } from "console";

export const getAllController = async (request, response) => {
  try {
    const user = await userModel.findById(request.userId);

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const groups = await groupModel.find({ members: user._id });

    return response.status(200).json({
      message: "Groups fetched successfully",
      data: groups,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const getOneController = async (request, response) => {
  try {
    const { groupId } = request.params;

    const user = await userModel.findById(request.userId);

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const group = await groupModel.findById(groupId);
    const isMember = group?.members.some((member) => member.equals(user._id));

    if (!isMember) {
      return response.status(404).json({
        message: "Group not found",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      message: "Groups fetched successfully",
      data: group,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const createGroupController = async (request, response) => {
  try {
    const { name, type, members } = request.body;

    if (!name || !type || !Array.isArray(members)) {
      return response.status(400).json({
        message: "Please fill the required details",
        error: true,
        success: false,
      });
    }

    const user = await userModel.findById(request.userId);

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    members.push(user._id.toString());
    const uniqueMembers = members.filter(
      (id, index, arr) => arr.indexOf(id) === index,
    );

    const userIds = await userModel
      .find({ _id: { $in: uniqueMembers } })
      .select("_id");

    if (userIds.length !== uniqueMembers.length) {
      return response.status(400).json({
        message: "One or more members are invalid",
        error: true,
        success: false,
      });
    }

    const joinCode = crypto.randomBytes(16).toString("hex");

    const payload = {
      name: name,
      type: type,
      admin: user._id,
      members: uniqueMembers.map((id) => new mongoose.Types.ObjectId(id)),
      joinCode: joinCode,
    };

    const newGroup = new groupModel(payload);
    await newGroup.save();

    return response.status(201).json({
      message: "New group created successfully",
      data: {
        groupId: newGroup._id,
      },
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const addMemberControlller = async (request, response) => {
  const { userId, groupId } = request.body;

  const userWhoIsAdding = await userModel.findById(request.userId);
  const userToBeAdded = await userModel.findById(userId);
  const group = await groupModel.findById(groupId);

  if (!userWhoIsAdding || !userToBeAdded) {
    return response.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  if (!group) {
    return response.status(404).json({
      message: "Group not found",
      error: true,
      success: false,
    });
  }

  if (!group.members.some((id) => id.equals(userWhoIsAdding._id))) {
    return response.status(400).json({
      message: "Only members can add others to the group",
      error: true,
      success: false,
    });
  }

  if (group.members.some((id) => id.equals(userToBeAdded._id))) {
    return response.status(409).json({
      message: "User already exists in the group",
      error: true,
      success: false,
    });
  }

  group.members.push(userToBeAdded._id);
  await group.save();

  return response.status(200).json({
    message: "User added to group successfully",
    error: false,
    success: true,
  });
};

export const removeMemberControlller = async (request, response) => {
  const { userId, groupId } = request.body;

  const userWhoIsRemoving = await userModel.findById(request.userId);
  const userToBeRemoved = await userModel.findById(userId);
  const group = await groupModel.findById(groupId);

  if (!userWhoIsRemoving || !userToBeRemoved) {
    return response.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  if (!group) {
    return response.status(404).json({
      message: "Group not found",
      error: true,
      success: false,
    });
  }

  if (!group.admin.equals(userWhoIsRemoving._id)) {
    return response.status(400).json({
      message: "Only admin can remove others from the group",
      error: true,
      success: false,
    });
  }

  const idx = group.members.findIndex((id) => id.equals(userToBeRemoved._id));

  if (idx === -1) {
    return response.status(404).json({
      message: "User not found in the group",
      error: true,
      success: false,
    });
  }

  group.members.splice(idx, 1);
  await group.save();

  return response.status(200).json({
    message: "User removed from group successfully",
    error: false,
    success: true,
  });
};

export const joinControlller = async (request, response) => {
  const { joinCode } = request.body;

  const user = await userModel.findById(request.userId);
  const group = await groupModel.findOne({ joinCode: joinCode });

  if (!user) {
    return response.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  if (!group) {
    return response.status(404).json({
      message: "Group not found",
      error: true,
      success: false,
    });
  }

  if (group.members.some((id) => id.equals(user._id))) {
    return response.status(409).json({
      message: "User already exists in the group",
      error: true,
      success: false,
    });
  }

  group.members.push(user._id);
  await group.save();

  return response.status(200).json({
    message: "Joined the group successfully",
    error: false,
    success: true,
  });
};

export const leaveControlller = async (request, response) => {
  const { groupId } = request.body;

  const user = await userModel.findById(request.userId);
  const group = await groupModel.findById(groupId);

  if (!user) {
    return response.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  if (!group) {
    return response.status(404).json({
      message: "Group not found",
      error: true,
      success: false,
    });
  }

  if (group.admin.equals(user._id)) {
    return response.status(400).json({
      message: "Admin can't leave the group",
      error: true,
      success: false,
    });
  }

  const idx = group.members.findIndex((id) => id.equals(user._id));

  if (idx === -1) {
    return response.status(404).json({
      message: "User not found in the group",
      error: true,
      success: false,
    });
  }

  group.members.splice(idx, 1);
  await group.save();

  return response.status(200).json({
    message: "Left the group successfully",
    error: false,
    success: true,
  });
};
