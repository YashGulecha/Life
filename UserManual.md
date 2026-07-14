# Pulse (Life OS) — User Manual

Welcome to **Pulse**, your personal command-driven Life OS. Pulse is designed to be a lightweight management engine that minimizes the friction of manual data entry. 

---

## ⚡ The Core Philosophy: Rapid Capture
Pulse uses a **Command-Line Interface (CLI)** as its primary input mechanism. Instead of navigating multiple pages and filling out heavy forms, you can log details in seconds using commands in the search bar.

*   **Global Shortcut**: Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) to instantly focus the command bar.
*   **Auto-Suggestions**: Typing a slash `/` will list all available commands.

---

## 🛠️ Command Reference Guide

Here is the exact syntax for all logging commands. Capitalization of tags is done automatically.

### 1. Personal Finances 💰
Keep track of expenses and income directly from the CLI.
*   **Log an Expense**: `/spent <amount> <category> [description]`
    *   *Example*: `/spent 450 Food dinner at nandos`
    *   *Example*: `/spent 120 Transport bus ticket`
*   **Log an Income**: `/income <amount> <category> [description]`
    *   *Example*: `/income 50000 Salary monthly paycheck`

### 2. Health & Telemetry 🍎
Monitor physical vails and log habits daily.
*   **Sleep Duration**: `/health sleep <hours> [notes]`
    *   *Example*: `/health sleep 7.5 felt rested`
*   **Hydration**: `/health water <units> [notes]`
    *   *Example*: `/health water 2 logged 2 glasses`
    *   *Tip*: You can also click the `+` button in the **Health Monitor** widget to quickly add 1 glass of water.
*   **Body Weight**: `/health weight <kilograms> [notes]`
    *   *Example*: `/health weight 72.4 morning check`
*   **Energy Level**: `/health energy <1-5> [notes]` (Rate your focus/energy from 1 to 5)
    *   *Example*: `/health energy 4 high focus today`

### 3. Academics & Todo 🎓
Manage deadlines, tasks, and exam countdowns.
*   **Create a Task**: `/todo <task name> [due_date YYYY-MM-DD]`
    *   *Example*: `/todo study for algorithms midterm 2026-07-20`
    *   *Example*: `/todo buy groceries` (No date needed)
    *   *Note*: Tasks with due dates automatically calculate a countdown timer (e.g. `3d` remaining) on your dashboard.

### 4. Personal CRM (Relations) 👥
Track your inner circle and ensure you don't lose contact with key people.
*   **Log an Interaction**: `/rel <name> | [interaction notes]`
    *   *Example*: `/rel Mom | called her for 20 mins to catch up`
    *   *Example*: `/rel Yash | discussion about capacitor apk`
    *   *Note*: If you log contact with someone who isn't in your CRM yet, the engine automatically adds them with a default check-in interval of 14 days.

### 5. Notes & Wiki 📝
Write markdown notes or append to lists.
*   **Create or Append to a Note**: `/note <title> | [markdown content]`
    *   *Example*: `/note Shopping List | * Milk\n* Bread\n* Eggs`
    *   *Tip*: If you run the command `/note Shopping List | * Apples` later, it will **append** `* Apples` to your existing shopping list note instead of overwriting it!

---

## 📊 Dashboard Modules

Your dashboard compiles these command logs into an intuitive single-screen overview:

1.  **Finance Index**: Displays your monthly total expenses and net liquid asset values.
2.  **Health Monitor**: Shows your hydration count, latest weight, and sleep duration.
3.  **Academics**: Displays your active semester status and counts active courses.
4.  **Relationships CRM**: Lists your contacts. The list automatically sorts by **urgency**—contacts who are past their check-in threshold are highlighted in gold at the top of the list.
5.  **Vitals Analytics Chart**: Rendered using Recharts, it plots your sleep and energy levels over the last 7 days to help you correlate rest with daily performance.
6.  **Countdowns**: Displays active todos and assignments sorted by proximity to the due date.

---

## 🛠️ Modifying the codebase

If you ever need to adjust server configurations:
*   [docker-compose.yml](file:///home/ubuntu/docker/life/docker-compose.yml): Set container routing, networks, and Traefik domains.
*   [backend/app/models.py](file:///home/ubuntu/docker/life/backend/app/models.py): Modify database tables and relations.
*   [backend/app/services/parser.py](file:///home/ubuntu/docker/life/backend/app/services/parser.py): Edit or add new CLI command routers.
