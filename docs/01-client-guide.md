# 01 — Client Guide (Non-Technical)

> **Who this is for:** Anyone who wants to understand how Lucy works **without any coding knowledge**. We use plain language and everyday analogies. No technical background needed.

---

## What Is Lucy, In One Sentence?

Lucy is a website where people chat with friendly AI "companions" — characters that remember you, get to know you over time, and can even talk back with a voice or send pictures — paid for with a monthly membership.

Think of it like a **Netflix subscription**, but instead of watching shows, you have ongoing conversations with AI characters.

---

## 1. How Users Sign Up

Signing up is like getting a membership card at a gym.

- A visitor clicks **"Sign up"** and enters an email and password (or uses Google/their existing account).
- A trusted company called **Clerk** handles all of this — Lucy never sees or stores the password itself. Clerk is like an **outsourced front-desk security guard** who checks IDs so Lucy doesn't have to.
- The moment someone signs up, Lucy automatically:
  - Creates their personal profile.
  - Puts them on the **Free plan**.
  - Drops **100 free "coins"** into their account as a welcome gift.

---

## 2. How Login Works

Logging in is showing your membership card to the front desk again.

- The user enters their email and password.
- Clerk (the front-desk guard) checks it and hands the user a temporary **wristband** (technically a "session token").
- As long as they're wearing the wristband, they can walk around the building (use the app) without showing ID at every door.
- When they log out — or after enough time passes — the wristband is removed and they must check in again.

---

## 3. How Subscriptions Work

Lucy has **three membership tiers**, like Bronze / Silver / Gold:

| Plan | Price | What you get |
|---|---|---|
| **Free** | $0 | 30 messages a day, 1 character, basic memory, 100 welcome coins |
| **Premium** | $14.99/month | Unlimited chatting, 3 characters, voice messages, voice calls, 2,000 coins/month |
| **Ultimate** | $39.99/month | Everything, unlimited characters, picture generation, unlimited voice, 6,000 coins/month |

**Coins** are like **arcade tokens**. Different activities cost a different number of tokens:

- Sending a text message = **1 coin**
- Generating a picture = **20 coins**
- One minute of voice = **10 coins**

Each month your plan refills your token bucket (100 / 2,000 / 6,000 depending on tier). Running low on tokens is what nudges people to upgrade — just like running out of arcade tokens makes you want to buy more.

---

## 4. How Payments Work

Lucy does **not** touch your credit card. Ever.

- When a user upgrades, they're handed off to **Stripe** — the same payment company used by thousands of major businesses. This is like being walked over to a **bank teller** to handle money, rather than handing cash to a random employee.
- Stripe collects the card details on its own secure page, charges the card, and then sends Lucy a **receipt notification** ("this person just paid for Premium").
- Lucy reads that receipt, upgrades the account, and refills their coins.
- Every month Stripe automatically re-bills and sends a new receipt; Lucy tops up the coins again.
- If a user cancels, they keep their benefits until the end of the period they already paid for — then quietly drop back to Free.

---

## 5. How AI Works

When a user types a message, here's the journey, like ordering at a restaurant:

1. The user's message is the **order**.
2. Before the order goes to the kitchen, a **bouncer** checks it isn't abusive or trying to trick the AI (this is the safety/moderation step).
3. Lucy gathers **context** — who the character is, what the character remembers about this user, and a summary of past conversations — and writes it all on the order ticket.
4. The ticket goes to **OpenRouter**, which is like a **food court** that can route the order to many different AI "chefs" (models from different AI companies). Lucy picks the right chef for the character.
5. The reply comes back **word by word, live** (streaming), like watching someone type in real time.
6. A final **quality check** makes sure the AI didn't leak its secret instructions or say anything against the rules before it's shown to the user.
7. Afterward, Lucy quietly **takes notes** about anything important the user said, to remember next time.

---

## 6. How Chat Works

- Each character the user talks to gets its **own conversation thread**, like separate text-message threads with different friends.
- Messages are saved forever (unless the user is in private/incognito mode), so users can scroll back through their history.
- The more a user chats with a character, the **closer the relationship grows** — from *stranger* up to *partner* — which changes how the character behaves.
- The character **remembers facts** between sessions (your name, things you like) thanks to the memory system.

---

## 7. How Image Generation Works

- Available on the **Ultimate** plan only.
- Inside a chat, the user can request a picture. It costs **20 coins**.
- Lucy asks the AI service to create an image and then posts it into the conversation like a photo message.

> **Note:** In the current build, image generation routes through the same AI provider used for text. Swapping in a dedicated image generator (the kind that makes high-quality pictures) is a planned upgrade.

---

## 8. How Admin Management Works

Behind the scenes, the Lucy team has a **control room** (the admin panel) — think of an **air-traffic-control tower** overseeing everything:

- **Users:** see every member, change their plan, give them bonus coins, or ban troublemakers.
- **Characters:** create and edit the official cast of AI companions everyone can chat with.
- **AI Models:** choose which AI "chefs" are available and test them.
- **Economy & Settings:** adjust coin prices and turn features on/off (like flipping switches), without needing a programmer.
- **Payments & Revenue:** see all the money coming in.
- **Analytics:** track how many people sign up, how many stick around (retention), and which characters are most popular.
- **Reports:** review complaints users file about content.

Only people with an **admin badge** can enter this control room — everyone else is automatically turned away at the door.

---

## Quick Glossary

| Term | Plain meaning |
|---|---|
| **Clerk** | The outsourced security guard handling logins |
| **Stripe** | The bank teller handling payments |
| **Coins** | Arcade tokens spent on messages, pictures, and voice |
| **OpenRouter** | The food court that routes requests to different AI models |
| **Memory** | Notes the AI keeps about you between chats |
| **Plan / Tier** | Your membership level (Free / Premium / Ultimate) |
| **Admin panel** | The team's behind-the-scenes control room |
