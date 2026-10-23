export const categories = [
  "roads",
  "utilities",
  "safety",
  "environment",
  "transit",
  "parks",
] as const;

export const statuses = ["open", "in-progress", "resolved"] as const;

export const neighborhoods = [
  "Downtown",
  "Riverside",
  "Oak Hill",
  "Harbor East",
  "Midtown",
  "West End",
  "Lakeside",
] as const;

export const verificationStatuses = [
  "unverified",
  "community-corroborated",
  "officially-confirmed",
] as const;

export type Category = (typeof categories)[number];
export type Status = (typeof statuses)[number];
export type Neighborhood = (typeof neighborhoods)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type MediaKind = "image" | "video" | "audio";
export type EvidenceSourceKind =
  | "photo"
  | "video"
  | "audio"
  | "link"
  | "source-post";

export type IssueAttachment = {
  id: string;
  kind: MediaKind;
  name: string;
  mimeType: string;
  url: string;
  caption?: string;
  poster?: string;
  /** Present only while a report is being created in the browser. */
  file?: File;
};

export type IssueCoordinates = {
  lat: number;
  lng: number;
};

export type EvidenceSource = {
  id: string;
  kind: EvidenceSourceKind;
  label: string;
  href?: string;
  attachmentId?: string;
  note?: string;
  recordedAt?: string;
};

export type Verification = {
  status: VerificationStatus;
  notes: string;
  assessedAt: string;
  assessedBy: string;
  sources: EvidenceSource[];
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: {
    name: string;
    initials: string;
  };
};

export type AiInsight = {
  summary: string;
  duplicateHints: string[];
  evidenceNotes: string;
  generatedAt: string;
  model: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  neighborhood: Neighborhood;
  address: string;
  upvotes: number;
  commentCount: number;
  reporter: {
    name: string;
    initials: string;
  };
  createdAt: string;
  tags?: string[];
  evidence?: string;
  coordinates?: IssueCoordinates | null;
  locationSource?: "gps" | "manual";
  attachments?: IssueAttachment[];
  verification: Verification;
  comments?: PostComment[];
  aiInsight?: AiInsight | null;
};

export const categoryLabels: Record<Category, string> = {
  roads: "Roads",
  utilities: "Utilities",
  safety: "Safety",
  environment: "Environment",
  transit: "Transit",
  parks: "Parks",
};

export const statusLabels: Record<Status, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  "community-corroborated": "Community Corroborated",
  "officially-confirmed": "Officially Confirmed",
};

export const SAMPLE_VIDEO_A =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
export const SAMPLE_VIDEO_B =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
export const SAMPLE_AUDIO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

function photo(seed: string, name: string, caption?: string): IssueAttachment {
  return {
    id: `att-${seed}`,
    kind: "image",
    name,
    mimeType: "image/jpeg",
    url: `https://picsum.photos/seed/${seed}/1280/800`,
    caption,
  };
}

export function unverifiedIntake(createdAt: string, sources: EvidenceSource[] = []): Verification {
  return {
    status: "unverified",
    notes:
      "Neighbor-submitted. Media is a local preview only and has not been independently confirmed by city staff or a trusted publisher.",
    assessedAt: createdAt,
    assessedBy: "Local Intel intake",
    sources,
  };
}

export const mockIssues: Issue[] = [
  {
    id: "iss-101",
    title: "Broken streetlight on Cedar Ave",
    description:
      "The lamp at the Cedar and 4th intersection has been dark for a week.\n\nDrivers are missing the stop line after dusk, and the crosswalk is basically invisible once the shops close.",
    category: "utilities",
    status: "open",
    neighborhood: "Oak Hill",
    address: "Cedar Ave & 4th St",
    upvotes: 42,
    commentCount: 11,
    reporter: { name: "Maya Patel", initials: "MP" },
    createdAt: "2026-10-21T08:15:00.000Z",
    tags: ["lighting", "night"],
    attachments: [
      photo("cedar-dark-1", "cedar-intersection-night.jpg", "Intersection after dusk"),
      photo("cedar-dark-2", "pole-base.jpg", "Pole and fixture from the sidewalk"),
      {
        id: "att-cedar-audio",
        kind: "audio",
        name: "ambient-night.mp3",
        mimeType: "audio/mpeg",
        url: SAMPLE_AUDIO,
        caption: "Sample ambient clip attached by the reporter",
      },
    ],
    verification: {
      status: "unverified",
      notes:
        "Single neighbor report with photos. No city work order is attached yet. Sample audio is a placeholder clip, not a field recording of this intersection.",
      assessedAt: "2026-10-21T12:00:00.000Z",
      assessedBy: "Local Intel intake",
      sources: [
        {
          id: "src-101-a",
          kind: "photo",
          label: "Night photo of Cedar & 4th",
          attachmentId: "att-cedar-dark-1",
          recordedAt: "2026-10-21T08:10:00.000Z",
        },
        {
          id: "src-101-b",
          kind: "photo",
          label: "Fixture close-up",
          attachmentId: "att-cedar-dark-2",
        },
        {
          id: "src-101-c",
          kind: "audio",
          label: "Reporter voice/ambient clip",
          attachmentId: "att-cedar-audio",
          note: "Placeholder sample file for playback in this demo.",
        },
      ],
    },
  },
  {
    id: "iss-102",
    title: "Pothole spreading across two lanes",
    description:
      "A deep pothole on Harbor Blvd is catching tires in both directions.\n\nSeveral neighbors have already reported rim damage. It has spread from the right lane into the center of the road this week.",
    category: "roads",
    status: "in-progress",
    neighborhood: "Harbor East",
    address: "Harbor Blvd near Pier 2",
    upvotes: 87,
    commentCount: 23,
    reporter: { name: "James Okonkwo", initials: "JO" },
    createdAt: "2026-10-18T14:40:00.000Z",
    tags: ["pothole", "traffic"],
    evidence: "Work order #PW-4419 opened after three independent neighbor posts.",
    attachments: [
      photo("pothole-1", "harbor-blvd-lane.jpg", "Near-side lane depression"),
      photo("pothole-2", "harbor-blvd-wide.jpg", "Same hole from the opposite curb"),
      {
        id: "att-pothole-video",
        kind: "video",
        name: "drive-by.mp4",
        mimeType: "video/mp4",
        url: SAMPLE_VIDEO_B,
        caption: "Drive-by clip used to show approach speed. Demo stock video.",
      },
    ],
    verification: {
      status: "community-corroborated",
      notes:
        "Corroborated by three separate neighbor reports and matching photos. Public Works listed it as in progress. Media includes a stock demo video, not a chain-of-custody field capture.",
      assessedAt: "2026-10-19T09:30:00.000Z",
      assessedBy: "Community moderators",
      sources: [
        {
          id: "src-102-a",
          kind: "photo",
          label: "Harbor Blvd lane photo",
          attachmentId: "att-pothole-1",
          recordedAt: "2026-10-18T14:38:00.000Z",
        },
        {
          id: "src-102-b",
          kind: "video",
          label: "Approach clip",
          attachmentId: "att-pothole-video",
        },
        {
          id: "src-102-c",
          kind: "source-post",
          label: "Related neighbor post",
          href: "#iss-111",
          note: "Hydrant leak one block east; same corridor.",
        },
        {
          id: "src-102-d",
          kind: "link",
          label: "Fairview Public Works map (demo)",
          href: "https://www.example.com/fairview/pw-4419",
          note: "Example URL. Not a live city record.",
        },
      ],
    },
  },
  {
    id: "iss-103",
    title: "Overflowing bins at Riverside Park",
    description:
      "Weekend crowds leave trash piled beside the bins. Crows are scattering wrappers onto the playground.",
    category: "parks",
    status: "open",
    neighborhood: "Riverside",
    address: "Riverside Park north gate",
    upvotes: 31,
    commentCount: 8,
    reporter: { name: "Elena Rossi", initials: "ER" },
    createdAt: "2026-10-22T11:05:00.000Z",
    tags: ["parks", "trash"],
    attachments: [
      photo("park-bins-1", "north-gate-bins.jpg", "Bins at the north gate"),
      photo("park-bins-2", "playground-litter.jpg", "Litter near the play area"),
    ],
    verification: {
      status: "unverified",
      notes:
        "Photos show overflow, but Parks has not confirmed a missed pickup. No official source is attached.",
      assessedAt: "2026-10-22T15:00:00.000Z",
      assessedBy: "Local Intel intake",
      sources: [
        {
          id: "src-103-a",
          kind: "photo",
          label: "North gate bins",
          attachmentId: "att-park-bins-1",
        },
        {
          id: "src-103-b",
          kind: "photo",
          label: "Playground litter",
          attachmentId: "att-park-bins-2",
        },
      ],
    },
  },
  {
    id: "iss-104",
    title: "Crosswalk signal stuck on red",
    description:
      "Pedestrians at Market and Pine wait through two full cycles. Several people have started crossing against the light.",
    category: "safety",
    status: "open",
    neighborhood: "Downtown",
    address: "Market St & Pine St",
    upvotes: 64,
    commentCount: 17,
    reporter: { name: "Chris Nguyen", initials: "CN" },
    createdAt: "2026-10-20T07:22:00.000Z",
    tags: ["signal", "pedestrian"],
    attachments: [
      photo("signal-1", "market-pine-signal.jpg", "Pedestrian signal head"),
      {
        id: "att-signal-video",
        kind: "video",
        name: "wait-cycle.mp4",
        mimeType: "video/mp4",
        url: SAMPLE_VIDEO_A,
        caption: "Stock demo clip standing in for a timed wait-cycle video.",
      },
    ],
    verification: {
      status: "community-corroborated",
      notes:
        "Two additional neighbors described the same stuck cycle during morning commute. Traffic engineering has not issued a confirmation.",
      assessedAt: "2026-10-20T18:40:00.000Z",
      assessedBy: "Community moderators",
      sources: [
        {
          id: "src-104-a",
          kind: "photo",
          label: "Signal head photo",
          attachmentId: "att-signal-1",
          recordedAt: "2026-10-20T07:20:00.000Z",
        },
        {
          id: "src-104-b",
          kind: "video",
          label: "Wait-cycle clip",
          attachmentId: "att-signal-video",
          note: "Demo video file, not a timestamped field recording.",
        },
        {
          id: "src-104-c",
          kind: "source-post",
          label: "Transit hub wait times",
          href: "#iss-112",
        },
      ],
    },
  },
  {
    id: "iss-105",
    title: "Bus stop shelter missing a panel",
    description:
      "The plexiglass on the westbound 12 line shelter is gone. Rain soaks the bench and the route map is unreadable.",
    category: "transit",
    status: "in-progress",
    neighborhood: "Midtown",
    address: "12 Line stop, 8th & Grant",
    upvotes: 19,
    commentCount: 4,
    reporter: { name: "Priya Shah", initials: "PS" },
    createdAt: "2026-10-16T16:10:00.000Z",
    attachments: [photo("shelter-1", "grant-shelter.jpg", "Westbound 12 shelter")],
    verification: {
      status: "officially-confirmed",
      notes:
        "Confirmed by Fairview Transit maintenance after a site visit. Replacement glass is on order. Confirmation is from the agency notice, not from an automated score.",
      assessedAt: "2026-10-17T11:05:00.000Z",
      assessedBy: "Fairview Transit",
      sources: [
        {
          id: "src-105-a",
          kind: "photo",
          label: "Shelter photo",
          attachmentId: "att-shelter-1",
        },
        {
          id: "src-105-b",
          kind: "link",
          label: "Transit maintenance bulletin (demo)",
          href: "https://www.example.com/transit/bulletin-12w",
          note: "Example URL representing an official notice.",
          recordedAt: "2026-10-17T10:50:00.000Z",
        },
      ],
    },
  },
  {
    id: "iss-106",
    title: "Storm drain clogged after last rain",
    description:
      "Water pools across the sidewalk on Lakeshore Dr. Kids walking to school have to step into the street.",
    category: "environment",
    status: "resolved",
    neighborhood: "Lakeside",
    address: "210 Lakeshore Dr",
    upvotes: 28,
    commentCount: 6,
    reporter: { name: "Owen Blake", initials: "OB" },
    createdAt: "2026-10-09T09:00:00.000Z",
    attachments: [
      photo("drain-1", "lakeshore-pool.jpg", "Standing water at the curb"),
      photo("drain-2", "drain-grate.jpg", "Grate after crew visit"),
    ],
    verification: {
      status: "officially-confirmed",
      notes:
        "Public Works posted a closeout photo after vacuuming the drain on Oct 11. Marked confirmed from that agency update.",
      assessedAt: "2026-10-11T16:20:00.000Z",
      assessedBy: "Fairview Public Works",
      sources: [
        {
          id: "src-106-a",
          kind: "photo",
          label: "Flooded sidewalk",
          attachmentId: "att-drain-1",
        },
        {
          id: "src-106-b",
          kind: "photo",
          label: "Cleared grate",
          attachmentId: "att-drain-2",
          recordedAt: "2026-10-11T16:12:00.000Z",
        },
        {
          id: "src-106-c",
          kind: "link",
          label: "PW closeout note (demo)",
          href: "https://www.example.com/pw/closeout-210-lakeshore",
        },
      ],
    },
  },
  {
    id: "iss-107",
    title: "Graffiti on the West End underpass",
    description:
      "Tags cover the lighting and wayfinding signs in the underpass. The path feels darker at night than it used to.",
    category: "safety",
    status: "open",
    neighborhood: "West End",
    address: "Rail underpass, West End Ave",
    upvotes: 15,
    commentCount: 3,
    reporter: { name: "Sofia Alvarez", initials: "SA" },
    createdAt: "2026-10-23T02:40:00.000Z",
    attachments: [
      photo("underpass-1", "west-end-wall.jpg", "Tagged wall and fixtures"),
      {
        id: "att-underpass-audio",
        kind: "audio",
        name: "underpass-note.mp3",
        mimeType: "audio/mpeg",
        url: SAMPLE_AUDIO,
        caption: "Reporter voice note (sample audio file).",
      },
    ],
    verification: unverifiedIntake("2026-10-23T08:00:00.000Z", [
      {
        id: "src-107-a",
        kind: "photo",
        label: "Underpass wall",
        attachmentId: "att-underpass-1",
      },
      {
        id: "src-107-b",
        kind: "audio",
        label: "Voice note",
        attachmentId: "att-underpass-audio",
        note: "Demo audio file.",
      },
    ]),
  },
  {
    id: "iss-108",
    title: "Playground swing hardware rusted through",
    description:
      "One swing at Oak Hill Commons dropped a chain link. Parents have taped it off, but kids still try to use it.",
    category: "parks",
    status: "in-progress",
    neighborhood: "Oak Hill",
    address: "Oak Hill Commons",
    upvotes: 53,
    commentCount: 14,
    reporter: { name: "Noah Kim", initials: "NK" },
    createdAt: "2026-10-14T18:30:00.000Z",
    attachments: [
      photo("swing-1", "broken-chain.jpg", "Rusted chain link"),
      photo("swing-2", "taped-bay.jpg", "Bay taped off by parents"),
    ],
    verification: {
      status: "community-corroborated",
      notes:
        "Photos match a second parent report from Oct 15. Parks scheduled hardware replacement. Not an official closeout yet.",
      assessedAt: "2026-10-15T13:10:00.000Z",
      assessedBy: "Community moderators",
      sources: [
        {
          id: "src-108-a",
          kind: "photo",
          label: "Broken chain",
          attachmentId: "att-swing-1",
        },
        {
          id: "src-108-b",
          kind: "photo",
          label: "Taped swing bay",
          attachmentId: "att-swing-2",
        },
      ],
    },
  },
  {
    id: "iss-109",
    title: "Illegal dumping behind the loading alley",
    description:
      "Mattresses and paint cans keep appearing behind the Midtown grocer. The smell is noticeable by afternoon.",
    category: "environment",
    status: "open",
    neighborhood: "Midtown",
    address: "Alley behind 440 Grant Ave",
    upvotes: 38,
    commentCount: 9,
    reporter: { name: "Hannah Brooks", initials: "HB" },
    createdAt: "2026-10-19T12:55:00.000Z",
    attachments: [
      photo("dump-1", "alley-mattress.jpg", "Discarded mattresses"),
      photo("dump-2", "paint-cans.jpg", "Open paint cans"),
      {
        id: "att-dump-video",
        kind: "video",
        name: "alley-walk.mp4",
        mimeType: "video/mp4",
        url: SAMPLE_VIDEO_B,
        caption: "Walk-through clip. Demo stock video.",
      },
    ],
    verification: unverifiedIntake("2026-10-19T16:00:00.000Z", [
      {
        id: "src-109-a",
        kind: "photo",
        label: "Mattress pile",
        attachmentId: "att-dump-1",
      },
      {
        id: "src-109-b",
        kind: "video",
        label: "Alley walk-through",
        attachmentId: "att-dump-video",
      },
    ]),
  },
  {
    id: "iss-110",
    title: "Faded lane markings on the river bridge",
    description:
      "Bike lane paint has worn off the eastbound span. Cars drift into the lane during evening commute.",
    category: "roads",
    status: "resolved",
    neighborhood: "Riverside",
    address: "River Bridge eastbound",
    upvotes: 71,
    commentCount: 12,
    reporter: { name: "Luis Ferreira", initials: "LF" },
    createdAt: "2026-10-05T10:12:00.000Z",
    attachments: [
      photo("bridge-1", "faded-paint.jpg", "Worn bike lane before repaint"),
      photo("bridge-2", "fresh-paint.jpg", "After crew restriping"),
    ],
    verification: {
      status: "officially-confirmed",
      notes:
        "Transportation posted restriping complete on Oct 8 with before/after photos. Confirmed from that agency update.",
      assessedAt: "2026-10-08T14:00:00.000Z",
      assessedBy: "Fairview Transportation",
      sources: [
        {
          id: "src-110-a",
          kind: "photo",
          label: "Before restriping",
          attachmentId: "att-bridge-1",
        },
        {
          id: "src-110-b",
          kind: "photo",
          label: "After restriping",
          attachmentId: "att-bridge-2",
          recordedAt: "2026-10-08T13:40:00.000Z",
        },
        {
          id: "src-110-c",
          kind: "link",
          label: "Transportation notice (demo)",
          href: "https://www.example.com/dot/river-bridge-restripe",
        },
      ],
    },
  },
  {
    id: "iss-111",
    title: "Hydrant leaking onto the sidewalk",
    description:
      "A steady leak at 9th and Harbor has iced over twice this month. Pedestrians are cutting into the bike lane to avoid it.",
    category: "utilities",
    status: "open",
    neighborhood: "Harbor East",
    address: "9th St & Harbor Ave",
    upvotes: 22,
    commentCount: 5,
    reporter: { name: "Amina Diallo", initials: "AD" },
    createdAt: "2026-10-22T19:18:00.000Z",
    attachments: [photo("hydrant-1", "leaking-hydrant.jpg", "Hydrant at 9th & Harbor")],
    verification: unverifiedIntake("2026-10-22T20:00:00.000Z", [
      {
        id: "src-111-a",
        kind: "photo",
        label: "Hydrant leak photo",
        attachmentId: "att-hydrant-1",
      },
    ]),
  },
  {
    id: "iss-112",
    title: "Missing bus frequency after 8pm",
    description:
      "The 4 line used to run every 15 minutes at night. Riders are waiting 40+ minutes at the Downtown transfer.",
    category: "transit",
    status: "open",
    neighborhood: "Downtown",
    address: "Downtown Transit Hub",
    upvotes: 96,
    commentCount: 31,
    reporter: { name: "Theo Marin", initials: "TM" },
    createdAt: "2026-10-12T21:00:00.000Z",
    tags: ["night-service"],
    attachments: [
      photo("hub-1", "empty-bay.jpg", "Empty bay after 8pm"),
      {
        id: "att-hub-audio",
        kind: "audio",
        name: "wait-note.mp3",
        mimeType: "audio/mpeg",
        url: SAMPLE_AUDIO,
        caption: "Rider voice note (sample audio).",
      },
    ],
    verification: {
      status: "community-corroborated",
      notes:
        "Schedule screenshots and 20+ rider comments align. Fairview Transit has not published a service change for the 4 line.",
      assessedAt: "2026-10-13T08:15:00.000Z",
      assessedBy: "Community moderators",
      sources: [
        {
          id: "src-112-a",
          kind: "photo",
          label: "Empty bay photo",
          attachmentId: "att-hub-1",
        },
        {
          id: "src-112-b",
          kind: "audio",
          label: "Rider voice note",
          attachmentId: "att-hub-audio",
        },
        {
          id: "src-112-c",
          kind: "link",
          label: "Published 4 line timetable (demo)",
          href: "https://www.example.com/transit/line-4",
          note: "Example timetable URL.",
        },
      ],
    },
  },
];
