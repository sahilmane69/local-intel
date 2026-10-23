import type { AiInsight, PostComment } from "@/data/issues";

export const mockComments: Record<string, PostComment[]> = {
  "iss-101": [
    {
      id: "c-101-1",
      postId: "iss-101",
      parentId: null,
      body: "Walked through here at 9pm. Completely dark on the Oak Hill side.",
      createdAt: "2026-10-21T21:10:00.000Z",
      author: { name: "Noah Kim", initials: "NK" },
    },
    {
      id: "c-101-2",
      postId: "iss-101",
      parentId: "c-101-1",
      body: "Same. I used my phone flashlight to cross.",
      createdAt: "2026-10-21T21:40:00.000Z",
      author: { name: "Priya Shah", initials: "PS" },
    },
  ],
  "iss-102": [
    {
      id: "c-102-1",
      postId: "iss-102",
      parentId: null,
      body: "Hit this on the way to Pier 2. Felt like the whole wheel dropped in.",
      createdAt: "2026-10-18T18:02:00.000Z",
      author: { name: "Elena Rossi", initials: "ER" },
    },
    {
      id: "c-102-2",
      postId: "iss-102",
      parentId: null,
      body: "Public Works cone is there now, but the hole is still open.",
      createdAt: "2026-10-19T11:20:00.000Z",
      author: { name: "Chris Nguyen", initials: "CN" },
    },
  ],
  "iss-104": [
    {
      id: "c-104-1",
      postId: "iss-104",
      parentId: null,
      body: "Stuck on red through two full cycles this morning. People are walking anyway.",
      createdAt: "2026-10-20T12:15:00.000Z",
      author: { name: "Maya Patel", initials: "MP" },
    },
  ],
  "iss-112": [
    {
      id: "c-112-1",
      postId: "iss-112",
      parentId: null,
      body: "Waited 38 minutes for a 4 last night. Hub was packed.",
      createdAt: "2026-10-13T01:12:00.000Z",
      author: { name: "Amina Diallo", initials: "AD" },
    },
  ],
};

export const mockAiInsights: Record<string, AiInsight> = {
  "iss-101": {
    summary:
      "Neighbors describe a dark intersection after dusk. Photos show a fixture and pole, but lighting conditions cannot be independently confirmed from sample media.",
    duplicateHints: ["No close duplicate of this exact intersection was found in the current feed."],
    evidenceNotes:
      "Two still photos plus a placeholder audio clip. The audio file is a demo sample and should not be treated as a field recording.",
    generatedAt: "2026-10-21T12:05:00.000Z",
    model: "gemini-mock",
  },
  "iss-102": {
    summary:
      "Multiple neighbors describe a spreading pothole on Harbor Blvd. The corridor also has a nearby hydrant leak post.",
    duplicateHints: ["Related corridor post: Hydrant leaking onto the sidewalk (iss-111)."],
    evidenceNotes:
      "Still photos are consistent with a pavement failure. The attached video is a stock demo clip, not a chain-of-custody recording.",
    generatedAt: "2026-10-19T09:40:00.000Z",
    model: "gemini-mock",
  },
  "iss-104": {
    summary:
      "The report claims a pedestrian signal stuck on red at Market and Pine during commute hours.",
    duplicateHints: ["Possibly related wait-time complaints at Downtown Transit Hub (iss-112)."],
    evidenceNotes:
      "The wait-cycle video in this demo is a stock file. Treat it as illustration only.",
    generatedAt: "2026-10-20T18:45:00.000Z",
    model: "gemini-mock",
  },
};
