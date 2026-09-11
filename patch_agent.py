with open("backend/agent.py", "r") as f:
    content = f.read()

content = content.replace("tools=ALL_TOOLS", "tools=ALL_TOOLS") # find where to add

# Wait, let's just use replace_file_content instead.
