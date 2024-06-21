export type ItemType = "job" | "story" | "comment" | "poll" | "pollopt";

export type StoryType = "job" | "ask" | "show" | "top";

export type PostId = {
  id: number;
  type: StoryType;
};

export class Item {
  by?: string;
  descendants?: number;
  id: number;
  kids?: number[];
  score?: number;
  text?: string;
  time?: number;
  title?: string;
  type?: ItemType;
  parent?: number;
  url?: string;
}
