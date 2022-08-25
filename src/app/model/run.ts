export interface RunResponse {
  data: Run[];
  pagination: {
    "offset": number;
    "max": number;
    "size": number;
    "links": any[]
  }
}

export interface Run {
  "id": string;
  "weblink": string;
  "game": string;
  "level": {
    "data": []
  },
  "category": {
    "data": {
      "id": string; // "n2y350ed",
      "name": string; // "No Coins",
      "weblink": string; // "https://www.speedrun.com/subsurf#No_Coins",
      "type": string; // "per-game",
      "rules": string; //"####**No Coins Rules:**\r\n\r\n* **Attempt to survive** as long as possible without collecting a single coin. // Tents sobreviver o maior tempo sem colecionar uma única moeda.\r\n\r\n* **Time begins** upon the first frame \"Tap to Play\" disappears from the screen or the first frame of the \"Play Again\" screen fading. // **O tempo começa** no primeiro frame do \"Toque para Jogar\" desaparece da tela ou quando o primeiro frame da tela \"Jogar de novo\" desaparece.\r\n\r\n* **Time ends** upon the first visible frame of the a coin being collected, or upon the fading of the Interface after death (Score, Coins etc. disappearing) (excluding the \"keys\" category). // **O tempo acaba** no primeiro frame visível em que uma moeda é colecionada ou depois do HUD depois da morte desaparecer. (exceto a categoria \"keys\")\r\n\r\n* **Watching Advertisements** to increase run time is not allowed. // Vêr **anúncios** não é permitido. \r\n\r\n* **Pausing** during the run is not allowed. // **Pausar** o jogo durante a corrida não é permitido.\r\n\r\n* **Tutorial** is not allowed because it gives an unfair advantage by not having coins at the beginning. // **O Tutorial** não é permitido por conta da injusta vantagem de não ter moedas no começo da partida.\r\n\r\n## Run starts when you press \"Tap to play\", please include that in the video. // A corrida começa quando você pressiona \"Toque Para Jogar\" ou \"Jogar de novo\", por favor inclua-o no vídeo\r\n\r\n## **Top 25** runs must have in-game sound, with sound effects on and possibly the music. Failure to do  so will result in rejection. // **As dez melhores** corridas devem ter som no jogo, com música e efeitos sonoros. Corridas sem sons, resultará na rejeição.\r\n\r\n**Please Read Game Rules.** // ** Por Favor, leia as Regras do Jogo.**",
      "players": {
        "type": "exactly" | any;
        "value": number
      },
      "miscellaneous": false,
      "links": any[]
    }
  },
  "videos": {
    "links": [
      {
        "uri": string;
      }
    ],
    text?: string
  },
  "comment": string | null;
  "status": {
    "status": "new" | any;
  },
  "players": {
    "data": [
      {
        "rel": "user",
        "id": "81krd9lj",
        "names": {
          "international": "Caruso",
          "japanese": null
        },
        "supporterAnimation": false,
        "pronouns": null,
        "weblink": "https://www.speedrun.com/user/Caruso",
        "name-style": {
          "style": "solid",
          "color": {
            "light": "#EE2222",
            "dark": "#EE4444"
          }
        },
        "role": "user",
        "signup": "2022-07-25T14:26:14Z",
        "location": null,
        "twitch": null,
        "hitbox": null,
        "youtube": null,
        "twitter": null,
        "speedrunslive": null,
        "assets": {
          "icon": {
            "uri": null
          },
          "supporterIcon": null,
          "image": {
            "uri": null
          }
        },
        "links": any[]
      }
    ]
  },
  "date": string; // "2022-07-25",
  "submitted": string;// "2022-07-26T00:09:47Z",
  "times": {
    "primary": string; //"PT2.023S",
    "primary_t": number; // 2.023,
    "realtime": string; // "PT2.023S",
    "realtime_t": number // 2.023,
    "realtime_noloads": any; // null,
    "realtime_noloads_t": any; // 0,
    "ingame": any; //null,
    "ingame_t": any; //0
  },
  "system": {
    "platform": string;
    "emulated": boolean;
    "region": string | null;
  },
  "splits": any;
  "values": { [key: string]: string };
  "links": []
}
