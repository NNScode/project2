from math import ceil
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def normalize_pagination(page: int = 1, page_size: int = 20) -> tuple[int, int, int]:
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size
    return page, page_size, offset


def make_paged(items: list, total: int, page: int, page_size: int) -> dict:
    total_pages = max(1, ceil(total / page_size)) if total else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
