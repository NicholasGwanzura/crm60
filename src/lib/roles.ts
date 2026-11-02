export const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: "Platform admin",
  ORG_ADMIN: "Org admin",
  SALES_MANAGER: "Sales manager",
  SALES_REP: "Sales rep",
  PROJECT_MANAGER: "Project manager",
  TEAM_MEMBER: "Team member",
  VIEWER: "Viewer",
};

// Roles an org admin can assign. Platform admin is only assignable by another platform admin.
export const INVITABLE_ROLES = ["ORG_ADMIN", "SALES_MANAGER", "SALES_REP", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"] as const;
