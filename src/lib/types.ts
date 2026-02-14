import type { TobiInfo } from "./score";

export type { TobiInfo };

export type Group = {
  id: string;
  name: string;
  members: string[];
  createdAt: string;
};

export type SessionSettings = {
  rate: number;
  uma: number[];
  startPoints: number;
  returnPoints: number;
  tobi: boolean;
  tobiPenalty: number;
};

export type ChipConfig = {
  enabled: boolean;
  startChips: number;
  pricePerChip: number;
};

export type Round = {
  id: string;
  scores: (number | null)[];
  tobi?: TobiInfo;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  type: "shared" | "individual";
  forMembers?: string[];
};

export type Session = {
  id: string;
  groupId: string;
  date: string;
  members: string[];
  settings: SessionSettings;
  chipConfig: ChipConfig;
  rounds: Round[];
  chipCounts: number[];
  expenses: Expense[];
  status: "active" | "settled";
};
