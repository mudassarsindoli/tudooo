import type { CommentKind } from "./types";

export const KIND_COLOR_IDS: Record<CommentKind, string> = {
  TODO: "tudooo.todoForeground",
  FIXME: "tudooo.fixmeForeground",
  HACK: "tudooo.hackForeground",
  XXX: "tudooo.xxxForeground",
};

export const DEPLOY_BLOCKING_KINDS: readonly CommentKind[] = ["FIXME", "XXX"];
