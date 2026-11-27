/**
 * Site vocabulary. Every user-facing name for the core concepts (posts,
 * votes, communities, friends, profile sections) comes from here, so the
 * whole site can be renamed in one place. See the glossary in AGENTS.md.
 */
export const TERMS = {
  brand: "Valid",
  post: { one: "drop", many: "drops", action: "Drop it", pending: "Dropping…", create: "New drop" },
  comment: { one: "comment", many: "comments", action: "Comment", reply: "Reply" },
  community: { one: "community", many: "communities", prefix: "c/" },
  user: { prefix: "u/" },
  /** Upvotes are "valid" ("12 valid"); downvotes keep plain wording. */
  vote: { up: "Valid", score: "valid", down: "Downvote" },
  friend: {
    one: "friend",
    many: "friends",
    add: "Add friend",
    isFriend: "Friends",
    requested: "Request sent",
    accept: "Accept friend request",
    remove: "Unfriend",
  },
  anonymous: { label: "Lowkey", toggle: "Post lowkey" },
  profile: {
    /** Your own profile in navigation; other people's read "<name>'s space". */
    own: "Your space",
    possessive: "'s space",
    topFriends: "Top 8",
    friendSpace: "Friend Space",
    wall: "Wall",
    mood: "Mood",
    status: "Status",
    aboutMe: "About me",
    wantToMeet: "Who I'd like to meet",
    song: "Profile song",
    online: "Online now",
    message: "Message",
    customize: "Customize my page",
  },
} as const;

interface Countable {
  readonly one: string;
  readonly many: string;
}

/** "1 drop", "12 drops": picks the singular or plural term. */
export function termFor(count: number, term: Countable): string {
  return count === 1 ? term.one : term.many;
}

/** "community" → "Community". */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Jasmine's space": the title of someone else's profile page. */
export function spaceTitle(name: string): string {
  return `${name}${TERMS.profile.possessive}`;
}
