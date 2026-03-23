import { colors } from "./theme";

const groupMeta = {
  trip: { icon: "airplane-outline", color: "#5B8DEF" },
  home: { icon: "home-outline", color: "#FF8A65" },
  friends: { icon: "people-outline", color: "#AB47BC" },
  food: { icon: "restaurant-outline", color: "#FFB547" },
  office: { icon: "briefcase-outline", color: "#26A69A" },
  other: { icon: "grid-outline", color: colors.textMuted },
};

export const getGroupMeta = (type) =>
  groupMeta[type?.toLowerCase()] || groupMeta.other;
