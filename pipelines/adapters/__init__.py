"""
Adapter modules for converting external datasets to internal schema formats.

Each adapter module handles format-specific loading and transformation logic.
"""

from .p1_csv_adapter import load_p1_csv

__all__ = [
    "load_p1_csv",
]
