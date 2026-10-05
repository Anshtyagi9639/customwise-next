# Customs Wise website live chat (uWebChat + Microsoft Teams)

Visitors can start a live chat from the website chatbot. The Customs Wise team receives it in Microsoft Teams and replies there. The chat itself is provided by [uWebChat](https://uwebchat.com/en); the website only embeds uWebChat's chat window.

```
Visitor → Customs Wise chatbot → "Live Chat" → uWebChat window → uWebChat → Microsoft Teams → team member
        ←                                                       ←          ←                 ← reply
```

## How it appears on the website

- The Customs Wise chat button and assistant are unchanged: Our Services, Food Customs, Industries, Make an Enquiry and Call Us all work as before.
- When uWebChat is set up, a sixth option, **Live Chat**, appears in that menu. It opens uWebChat's chat window inside the same Customs Wise panel.
- uWebChat is not loaded at all until a visitor chooses Live Chat, so it costs nothing in page speed for everyone else.
- Until the two IDs below are set, the Live Chat option is hidden and the site behaves exactly as before.

## Setup

You need a Microsoft 365 account with Teams. No payment details are needed for the Free plan.

### 1. Install uWebChat in Microsoft Teams

1. In Teams, open **Apps**, search for **uWebChat** and choose **Add**. (If your organisation restricts apps, a Teams administrator must allow it first.)
2. Open the chat with the uWebChat bot. On first use it asks for your **company name**; a licence key is optional, so skip it to stay on Free.
3. Type `help` at any time to see the settings card.

### 2. Register the website's domain

In the uWebChat chat, type `Add Domain` and enter the domain the live site is served from.

- The Free plan allows **one** domain.
- Wildcards and sub-domains are not supported, so `customswise.ie` and `www.customswise.ie` count as different domains. Register the one visitors actually land on (the site's canonical address uses `www`).
- `Show Domains`, `Edit Domain` and `Remove Domain` manage the list.

### 3. Set up the group and agent

- A **group** is the set of people who answer website chats. Free allows one group and one agent.
- Type `show groups` to list groups and their **Group ID**.
- The agent must be **subscribed** to receive chats: type `Subscribe` (and `Unsubscribe` to stop receiving them).

### 4. Copy the two IDs into the website

| Value | How to get it in the uWebChat chat | Website variable |
| --- | --- | --- |
| Customer ID | type `debug` | `NEXT_PUBLIC_UWEBCHAT_CUSTOMER_ID` |
| Group ID | type `show groups` | `NEXT_PUBLIC_UWEBCHAT_GROUP_ID` |

Both look like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. They are identifiers that appear in the page's HTML, not passwords.

You can cross-check them by typing `Embed`: the code uWebChat generates contains a line like

```
https://pool01.uwebchat.com/uwebchat.html?group=<Group ID>&customer=<Customer ID>
```

If that address starts with something other than `pool01.uwebchat.com`, also set `NEXT_PUBLIC_UWEBCHAT_HOST` to that host name. Otherwise leave it unset.

Set the variables in the hosting control panel (and in `.env.local` for local work), then **rebuild and redeploy** the site. `NEXT_PUBLIC_` values are fixed into the site when it is built, so a restart alone is not enough.

### 5. Test it

1. Open the live website, open the chat and choose **Live Chat**.
2. Enter a name and send: "Hello, I would like to know more about Customs Wise services."
3. In Teams, the agent gets a notification card from uWebChat. Choose **Accept**.
4. Reply in that Teams chat. The reply appears on the website.
5. Send another message from the website and check it arrives in the same Teams conversation.
6. Open the site in a second browser and start another chat, to see that the two conversations stay separate.

## Answering chats in Teams

- A new chat arrives as a notification card. **Accept** or **Reject** it.
- After accepting, anything you type to the uWebChat bot is sent to the visitor. Their messages appear as cards.
- Text starting with `/` is a command and is not sent to the visitor. `/dc` or `/disconnect` ends the chat; the visitor is told the conversation has ended.
- If nobody accepts within 60 seconds, the request times out.

## What the Free plan does and does not include

Included: live web chat on one domain, one agent, one group, replies from Teams.

Not included on Free (checked against uWebChat's "Features per License" page; confirm there before relying on it):

| Feature | Needs |
| --- | --- |
| More than one agent, domain or group | Basic or higher |
| Remove the uWebChat logo from the chat window | Basic |
| Route by Teams presence (only offer chats to available agents) | Basic |
| "Leave a message" when nobody is available | Basic |
| Saved chat logs | Basic |
| Opening hours, chat transfer, custom branding of the chat window | Professional |
| Virtual agent / automated menus, real-time translation | Enterprise |

Consequences for Customs Wise on Free:

- The chat window inside the panel keeps uWebChat's own look and logo. The Customs Wise header around it is ours.
- Quick-reply menus cannot be configured inside uWebChat, which is why the existing Customs Wise assistant keeps that job.
- Only one person can answer chats, and there is no out-of-hours message: a visitor who starts a chat when nobody accepts simply sees it time out. The assistant's **Make an Enquiry** and **Call Us** options remain the fallback.

## Behaviour to be aware of

- The visitor is asked for a name before the chat starts. That is uWebChat's own form.
- Closing the chat panel, going back to the assistant, or moving to another page keeps the conversation open.
- A full page **refresh** reloads uWebChat's window. Whether the conversation resumes is decided by uWebChat; check it during step 5.
- Conversations and their isolation are handled entirely by uWebChat. The website stores no messages and has no chat server of its own.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| No Live Chat option in the chatbot | The two IDs are missing or mistyped, or the site was not rebuilt after setting them |
| Chat window opens but shows an error or stays blank | The site's domain is not registered in uWebChat (step 2), or the IDs belong to another account |
| Messages never reach Teams | The agent is not subscribed, or the Group ID is for a different group |
| Chat request times out | Nobody accepted the notification card within 60 seconds |

## Where the code is

| Part | Location |
| --- | --- |
| Builds the uWebChat address from the two IDs | `lib/uwebchat.ts` |
| Customs Wise panel around uWebChat's window | `components/chatbot/live-chat-panel.tsx` |
| "Live Chat" option and switching between assistant and live chat | `components/chatbot/chatbot.tsx`, `components/chatbot/chat-window.tsx` |

If a Content-Security-Policy is ever added to the site, it must allow `frame-src https://*.uwebchat.com`.
