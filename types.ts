export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
}

export enum Genre {
  ROMANCE = 'Romance',
  THRILLER = 'Thriller',
  HORROR = 'Horror',
  DRAMA = 'Drama',
  FANTASY = 'Fantasy',
  SCIFI = 'Sci-Fi',
  HISTORICAL = 'Historical',
  EROTICA = 'Erotica', // Explicitly requested category
  OTHER = 'Other',
}

export interface Character {
  id: string;
  name: string;
  role: string; // Protagonist, Antagonist, etc.
  description: string;
}

export interface Scene {
  id: string;
  description: string; // The prompt used
  imageUrl?: string;
  variants?: string[]; // Store multiple variations
  timestamp: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  scenes?: Scene[];
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  genre: Genre;
  isAdult: boolean; // 18+ Toggle
  coverImage?: string; // URL or base64 placeholder
  createdAt: number;
  updatedAt: number;
  chapters: Chapter[];
  characters: Character[];
}

export interface AIResponse {
  text: string;
  error?: string;
}