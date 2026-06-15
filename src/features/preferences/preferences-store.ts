import { createStore } from "jotai";

export const preferencesStore = createStore();

export type PreferencesStore = typeof preferencesStore;
