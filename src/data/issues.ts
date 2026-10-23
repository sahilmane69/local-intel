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

export type Category = (typeof categories)[number];
export type Status = (typeof statuses)[number];
export type Neighborhood = (typeof neighborhoods)[number];

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

export const mockIssues: Issue[] = [
  {
    id: "iss-101",
    title: "Broken streetlight on Cedar Ave",
    description:
      "The lamp at the Cedar and 4th intersection has been dark for a week. Drivers are missing the stop line after dusk.",
    category: "utilities",
    status: "open",
    neighborhood: "Oak Hill",
    address: "Cedar Ave & 4th St",
    upvotes: 42,
    commentCount: 11,
    reporter: { name: "Maya Patel", initials: "MP" },
    createdAt: "2026-10-21T08:15:00.000Z",
  },
  {
    id: "iss-102",
    title: "Pothole spreading across two lanes",
    description:
      "A deep pothole on Harbor Blvd is catching tires in both directions. Several neighbors have already reported rim damage.",
    category: "roads",
    status: "in-progress",
    neighborhood: "Harbor East",
    address: "Harbor Blvd near Pier 2",
    upvotes: 87,
    commentCount: 23,
    reporter: { name: "James Okonkwo", initials: "JO" },
    createdAt: "2026-10-18T14:40:00.000Z",
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
  },
];
