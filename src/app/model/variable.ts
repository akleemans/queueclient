export interface VariableResonse {
  data: Category[];
}

export interface VariableMap {
  [key: string]: string
}

export interface Category {
  "id": string;
  "name": string;
  "category": string;
  "scope": {
    "type": "full-game" | "level"
  },
  "mandatory": boolean;
  "user-defined": boolean;
  "obsoletes": boolean;
  "values": {
    "values": {
      [key: string]:
        {
          "label": string,
          "rules": string | null,
          "flags": {
            "miscellaneous": boolean
          }
        }
    },
    "default": string
  },
  "is-subcategory": boolean,
  "links": any;
}
