# tools.py

import os

def write_code_to_file(filename: str, code: str) -> str:
    """
    Writes a block of code to a specified file.
    If the file exists, it will be overwritten.
    """
    try:
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w') as f:
            f.write(code)
        
        return f"Successfully wrote {len(code)} characters to {filename}."
    except Exception as e:
        return f"Error writing to file: {e}"

# You can add more tools here later!
# For example:
# def read_file(filename: str) -> str: ...
# def run_terminal_command(command: str) -> str: ...