/**
 * uWebChat (https://uwebchat.com): live chat answered by the Customs Wise team from Microsoft Teams.
 *
 * uWebChat's official embed is a chat window served from its own servers and shown in an iframe. It is identified by
 * the organisation's Customer ID plus either the Agent ID or the Group ID that should receive the chat, exactly as in
 * the embed code uWebChat generates ("Embed" in the uWebChat bot in Teams; see docs/live-chat-uwebchat.md).
 * These are public identifiers that appear in the page's HTML, not secrets, which is why they are NEXT_PUBLIC
 * variables. No Microsoft credentials are involved here.
 */

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOST = /^[a-z0-9-]+\.uwebchat\.com$/;
/** The server named in uWebChat's embed code. Override only if the code generated for your account shows another. */
const DEFAULT_HOST = "pool01.uwebchat.com";
const NAME_MAX = 60;

/** Address of the uWebChat chat window, or null when live chat has not been set up (the option is then hidden). */
export function uWebChatUrl(): string | null {
  // Referenced in full so Next.js can inline them into the browser bundle at build time.
  const customer = process.env.NEXT_PUBLIC_UWEBCHAT_CUSTOMER_ID?.trim().toLowerCase();
  const agent = process.env.NEXT_PUBLIC_UWEBCHAT_AGENT_ID?.trim().toLowerCase();
  const group = process.env.NEXT_PUBLIC_UWEBCHAT_GROUP_ID?.trim().toLowerCase();
  const host = process.env.NEXT_PUBLIC_UWEBCHAT_HOST?.trim().toLowerCase() || DEFAULT_HOST;
  // Anything that is not a well-formed ID or a uwebchat.com host is ignored rather than placed in a URL.
  if (!customer || !ID.test(customer) || !HOST.test(host)) return null;
  // An agent embed and a group embed are alternatives; the agent wins if both are set.
  const target = agent && ID.test(agent) ? `agent=${agent}` : group && ID.test(group) ? `group=${group}` : null;
  return target ? `https://${host}/uwebchat.html?${target}&customer=${customer}` : null;
}

/**
 * Adds the visitor's name using uWebChat's own `name` parameter, so they are not asked for it twice.
 * It is the only detail uWebChat's chat window accepts from the page that embeds it.
 */
export function withVisitorName(url: string, name: string): string {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  return clean ? `${url}&name=${encodeURIComponent(clean)}` : url;
}
