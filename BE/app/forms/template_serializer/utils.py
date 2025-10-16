"""
Utility functions for JSON file operations
"""

import json
import os
from datetime import datetime
from typing import Any
from pathlib import Path
from pydantic import BaseModel


def save_to_json(
    schema: BaseModel, filename: str = None, output_dir: str = "exports"
) -> str:
    """
    Save Pydantic schema to JSON file

    Args:
        schema: Pydantic model to save
        filename: Optional custom filename (without extension)
        output_dir: Directory to save the file in

    Returns:
        str: Path to the saved file
    """
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Generate filename
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if hasattr(schema, "name"):
            filename = f"form_template_{schema.name}_{timestamp}"
        else:
            filename = f"export_{timestamp}"

    # Ensure filename has .json extension
    if not filename.endswith(".json"):
        filename += ".json"

    # Create full file path
    file_path = os.path.join(output_dir, filename)

    # Convert schema to dict and save
    data = schema.model_dump()

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    return file_path


def load_json(file_path: str) -> Any:
    """
    Load JSON data from file

    Args:
        file_path: JSON file path

    Returns:
        Any: Loaded JSON data
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
