# Customs Wise website live chat (uWebChat + Microsoft Teams)

Visitors can start a live chat from the website chatbot. The Customs Wise team receives it in Microsoft Teams and replies there. The chat itself is provided by [uWebChat](https://uwebchat.com/en); the website only embeds uWebChat's chat window.

```
Visitor → Customs Wise chatbot → "Live Chat" → uWebChat window → uWebChat → Microsoft Teams → team member
        ←                                                       ←          ←                 ← reply
```

## How it appears on the website

- The Customs Wise chat button and assistant are unchanged: Our Services, Food Customs, Industries, Make an Enquiry and Call Us all work as before.
- When uWebChat is set up, a sixth option, **Live Chat**, appears in that menu.
- Live Chat first shows a short Customs Wise form: **Name, Email, Phone** and **How can we help?** (all required, checked as the visitor submits).
- After the form, uWebChat's chat window opens inside the same Customs Wise panel, already greeting the visitor by name. They press **Start chat!** there and type their message.
- There is one chat button on the page. uWebChat's own floating button, and the `webchat-button.css` / `webchat-button.js` files that only exist to draw it, are deliberately not loaded.
- uWebChat is not loaded at all until a visitor submits the form, so it costs nothing in page speed for everyone else.
- The chatbot has no free-text box: visitors use the six options, and type only inside Live Chat.
- **Live Chat** is always shown and always opens the details form. Until the IDs below are set, submitting the form shows "We couldn't connect you", says plainly that the details were not sent, and offers the enquiry form and phone number.

### What happens to the form details

| Detail | Where it goes |
| --- | --- |
| Name | Passed to uWebChat (its `name` setting), so the agent sees it in Teams and the visitor is not asked twice |
| Email, phone, message | Kept in the visitor's browser for that tab only, with the time the form was submitted. **Not sent to Teams** |
| Time started | Shown to the visitor above the chat, e.g. "Started: 06 Oct 2026, 11:42 AM GMT+1" (their local time; stored as ISO 8601) |

uWebChat's chat window is a page on uWebChat's own servers. The website cannot type into it, read it, or press its buttons, so the email, phone and message cannot be handed over automatically. The visitor gets a **Copy my message** link to paste their message into the chat.

If the team needs the email and phone in Teams, uWebChat can ask for them itself: adding `&fields=email,phone&required=email,phone` to its address makes its own start screen collect them and show them to the agent. That would replace the email and phone boxes in the Customs Wise form rather than add to them.

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

Type `Embed` to the uWebChat bot. The code it generates contains a line like one of these:

```
https://pool01.uwebchat.com/uwebchat.html?agent=<Agent ID>&customer=<Customer ID>
https://pool01.uwebchat.com/uwebchat.html?group=<Group ID>&customer=<Customer ID>
```

| Value | Website variable |
| --- | --- |
| Customer ID (after `customer=`) | `NEXT_PUBLIC_UWEBCHAT_CUSTOMER_ID` |
| Agent ID (after `agent=`), for a chat that goes to one person | `NEXT_PUBLIC_UWEBCHAT_AGENT_ID` |
| Group ID (after `group=`), for a chat offered to a group | `NEXT_PUBLIC_UWEBCHAT_GROUP_ID` |

Set the Customer ID and **one** of the other two. Each looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` and must be copied in full. They are identifiers that appear in the page's HTML, not passwords. (`debug` and `show groups` also show the Customer ID and Group IDs.)

If that address starts with something other than `pool01.uwebchat.com`, also set `NEXT_PUBLIC_UWEBCHAT_HOST` to that host name. Otherwise leave it unset.

Set the variables in the hosting control panel (and in `.env.local` for local work), then **rebuild and redeploy** the site. `NEXT_PUBLIC_` values are fixed into the site when it is built, so a restart alone is not enough.

### 5. Test it

1. Open the live website, open the chat and choose **Live Chat**.
2. Fill in the form and choose **Start Live Chat**, press **Start chat!** in the chat window, then send: "Hello, I would like to know more about Customs Wise services."
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

- The website shows no "connected" message of its own: only uWebChat's window knows when a team member has joined, and it says so itself.
- The website cannot tell whether the team is available. On the Free plan uWebChat has no "leave a message" option either, so an unanswered request simply times out.
- After a page refresh the form is not shown again in that tab; Live Chat goes straight back to the chat window.
- Closing the chat panel, going back to the assistant, or moving to another page keeps the conversation open.
- A full page **refresh** reloads uWebChat's window. Whether the conversation resumes is decided by uWebChat; check it during step 5.
- Conversations and their isolation are handled entirely by uWebChat. The website stores no messages and has no chat server of its own.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| After the form, Live Chat says "We couldn't connect you" | The Customer ID, or both the Agent and Group ID, are missing, cut short or mistyped, or the site was not rebuilt after setting them |
| Chat window opens but shows an error or stays blank | The site's domain is not registered in uWebChat (step 2), or the IDs belong to another account |
| Messages never reach Teams | The agent is not subscribed, or the Group ID is for a different group |
| Chat request times out | Nobody accepted the notification card within 60 seconds |

## Where the code is

| Part | Location |
| --- | --- |
| Builds the uWebChat address from the IDs | `lib/uwebchat.ts` |
| Start form, stored details and the Customs Wise panel around uWebChat's window | `components/chatbot/live-chat-panel.tsx` |
| "Live Chat" option and switching between assistant and live chat | `components/chatbot/chatbot.tsx`, `components/chatbot/chat-window.tsx` |

If a Content-Security-Policy is ever added to the site, it must allow `frame-src https://*.uwebchat.com`.
