/** Lightweight blog helpers with no post content, safe to import from client components. */

export const blogTopics = {
  "food-customs": "Food customs",
  "regulatory-updates": "Regulatory updates",
  "trade-policy": "Trade policy",
  "practical-guidance": "Practical guidance",
} as const;

export type BlogTopic = keyof typeof blogTopics;

/** A post's topic name: one of the topics above, or the category name it was given in the blog CMS. */
export function topicLabel(post: { topic: string; topicLabel?: string }): string {
  return post.topicLabel ?? blogTopics[post.topic as BlogTopic] ?? post.topic;
}

export function formatPostDate(iso: string) {
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));
}
