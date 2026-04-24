from fastapi import APIRouter
from services.route_service import get_routes

router = APIRouter()

@router.get("/route")
def route(start: str, end: str, vehicle: str = "car"):
    return get_routes(start, end, vehicle)