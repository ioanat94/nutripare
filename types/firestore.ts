export interface FirestoreUser {
  id: string;
  displayName: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  ean: string;
}

export interface SavedComparison {
  id: string;
  name: string;
  eans: string[];
}
