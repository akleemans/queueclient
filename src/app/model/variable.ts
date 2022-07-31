export interface VariableResonse {
  data: Category[];
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
      "klrjyeoq": {
        "label": "100 Coins",
        "rules": null,
        "flags": {
          "miscellaneous": false
        }
      },
      "8100wv51": {
        "label": "500 Coins",
        "rules": null,
        "flags": {
          "miscellaneous": false
        }
      },
      "gq79rvyl": {
        "label": "1000 Coins",
        "rules": null,
        "flags": {
          "miscellaneous": false
        }
      },
      "rqv278w1": {
        "label": "5000 Coins",
        "rules": null,
        "flags": {
          "miscellaneous": null
        }
      },
      "zqomrx21": {
        "label": "10000 Coins",
        "rules": null,
        "flags": {
          "miscellaneous": false
        }
      }
    },
    "default": "klrjyeoq"
  },
  "is-subcategory": boolean,
  "links": any;
}
