import re
from typing import Tuple, Dict, Any

def parse_command_string(cmd: str) -> Tuple[str, Dict[str, Any], str]:
    """
    Parses conversational commands like:
    - /spent 500 Food dinner at nandos
    - /health sleep 7.5
    - /todo study for algorithms exam 2026-07-20
    - /note Shopping List | milk, eggs, bread
    - /rel dad | called him to wish happy birthday
    
    Returns: (action_type, parsed_data, feedback_message)
    """
    cmd = cmd.strip()
    if not cmd.startswith("/"):
        return "unknown", {}, "Commands must start with a slash (/). Type /help to see all commands."
        
    parts = cmd.split(" ", 1)
    keyword = parts[0].lower()
    args_str = parts[1].strip() if len(parts) > 1 else ""
    
    if keyword in ("/spent", "/spend"):
        # Pattern: /spent <amount> <category> [description]
        match = re.match(r"^([\d\.]+)\s+(\w+)(?:\s+(.*))?$", args_str, re.IGNORECASE)
        if not match:
            return "unknown", {}, "Usage: /spent <amount> <category> [description] (e.g. /spent 500 Food dinner)"
        try:
            amount = float(match.group(1))
        except ValueError:
            return "unknown", {}, "Invalid amount specified. Must be a decimal/number."
        category = match.group(2)
        description = match.group(3) or ""
        return "finance", {
            "amount": amount,
            "transaction_type": "expense",
            "category": category.capitalize(),
            "description": description
        }, f"Logged expense of {amount} in {category.capitalize()}."

    elif keyword == "/income":
        # Pattern: /income <amount> <category> [description]
        match = re.match(r"^([\d\.]+)\s+(\w+)(?:\s+(.*))?$", args_str, re.IGNORECASE)
        if not match:
            return "unknown", {}, "Usage: /income <amount> <category> [description] (e.g. /income 5000 Salary monthly)"
        try:
            amount = float(match.group(1))
        except ValueError:
            return "unknown", {}, "Invalid amount specified. Must be a decimal/number."
        category = match.group(2)
        description = match.group(3) or ""
        return "finance", {
            "amount": amount,
            "transaction_type": "income",
            "category": category.capitalize(),
            "description": description
        }, f"Logged income of {amount} in {category.capitalize()}."

    elif keyword == "/health":
        # Pattern: /health <sleep|weight|water|energy> <value> [notes]
        match = re.match(r"^(\w+)\s+([\d\.]+)(?:\s+(.*))?$", args_str, re.IGNORECASE)
        if not match:
            return "unknown", {}, "Usage: /health <sleep|weight|water|energy> <value> [notes]"
        metric = match.group(1).lower()
        try:
            value = float(match.group(2))
        except ValueError:
            return "unknown", {}, "Invalid metric value. Must be a decimal/number."
        notes = match.group(3) or ""
        
        if metric == "sleep":
            return "health", {"sleep_duration": value, "notes": notes}, f"Logged {value} hours of sleep."
        elif metric == "weight":
            return "health", {"weight": value, "notes": notes}, f"Logged weight of {value} kg."
        elif metric == "water":
            return "health", {"water_intake": int(value), "notes": notes}, f"Logged {int(value)} units of water."
        elif metric == "energy":
            if not (1 <= value <= 5):
                return "unknown", {}, "Energy level must be an integer between 1 and 5."
            return "health", {"energy_level": int(value), "notes": notes}, f"Logged energy level of {int(value)}/5."
        else:
            return "unknown", {}, f"Unknown health metric: {metric}. Choose sleep, weight, water, or energy."

    elif keyword == "/todo":
        # Pattern: /todo <task name> [YYYY-MM-DD]
        # Match optional date at the end (YYYY-MM-DD)
        match = re.search(r"\s+(\d{4}-\d{2}-\d{2})$", args_str)
        due_date = None
        task_name = args_str
        if match:
            due_date = match.group(1)
            task_name = args_str[:match.start()].strip()
            
        if not task_name:
            return "unknown", {}, "Usage: /todo <task name> [due_date YYYY-MM-DD]"
            
        return "todo", {
            "title": task_name,
            "due_date": due_date
        }, f"Added task: '{task_name}'" + (f" due on {due_date}." if due_date else ".")

    elif keyword == "/note":
        # Pattern: /note <title> | [content]
        if "|" in args_str:
            title, content = args_str.split("|", 1)
        else:
            title = args_str
            content = ""
            
        title = title.strip()
        content = content.strip()
        if not title:
            return "unknown", {}, "Usage: /note <title> | [content]"
            
        return "note", {
            "title": title,
            "content": content
        }, f"Created note: '{title}'."

    elif keyword == "/rel":
        # Pattern: /rel <name> | [notes]
        if "|" in args_str:
            name, notes = args_str.split("|", 1)
        else:
            name = args_str
            notes = ""
            
        name = name.strip()
        notes = notes.strip()
        if not name:
            return "unknown", {}, "Usage: /rel <name> | [notes]"
            
        return "relation", {
            "name": name,
            "notes": notes
        }, f"Logged contact interaction with {name}."

    elif keyword in ("/help", "/?"):
        help_text = (
            "Available commands:\n"
            "• /spent <amount> <category> [description] - Log an expense\n"
            "• /income <amount> <category> [description] - Log income\n"
            "• /health <sleep|weight|water|energy> <value> [notes] - Log health metrics\n"
            "• /todo <task name> [YYYY-MM-DD] - Add a task\n"
            "• /note <title> | [content] - Create a markdown note\n"
            "• /rel <name> | [notes] - Log relationship contact"
        )
        return "help", {}, help_text

    return "unknown", {}, f"Unknown command: '{keyword}'. Type /help to see available options."
