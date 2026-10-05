/**
 * uWebChat (https://uwebchat.com): live chat answered by the Customs Wise team from Microsoft Teams.
 *
 * uWebChat's official embed is a chat window served from its own servers and shown in an iframe, identified by the
 * organisation's Customer ID and the Group ID of the team that answers. Both come from the uWebChat bot in Teams
 * ("debug" and "show groups"; see docs/live-chat-uwebchat.md). They are public identifiers that appear in the
 * page's HTML, not secrets, which is why they are NEXT_PUBLIC variables. No Microsoft credentials are involved here.
 */

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOST = /^[a-z0-9-]+\.uwebchat\.com$/;
/** The server named in uWebChat's embed code. Override only if the code generated for your account shows another. */
const DEFAULT_HOST = "pool01.uwebchat.com";

/** Address of the uWebChat chat window, or null when live chat has not been set up (the option is then hidden). */
export function uWebChatUrl(): string | null {
  // Referenced in full so Next.js can inline them into the browser bundle at build time.
  const customer = process.env.NEXT_PUBLIC_UWEBCHAT_CUSTOMER_ID?.trim();
  const group = process.env.NEXT_PUBLIC_UWEBCHAT_GROUP_ID?.trim();
  const host = process.env.NEXT_PUBLIC_UWEBCHAT_HOST?.trim().toLowerCase() || DEFAULT_HOST;
  // Anything that is not a well-formed ID or a uwebchat.com host is ignored rather than placed in a URL.
  if (!customer || !group || !ID.test(customer) || !ID.test(group) || !HOST.test(host)) return null;
  return `https://${host}/uwebchat.html?group=${group.toLowerCase()}&customer=${customer.toLowerCase()}`;
}
