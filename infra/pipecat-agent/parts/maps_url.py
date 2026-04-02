"""
Maps URL Builder — shared spare part.
Builds map URLs for Google (international) or Baidu/Amap (China).
Used by: search_places, get_directions, location tracking.
"""
import os

# Set MAP_PROVIDER=baidu or MAP_PROVIDER=amap for China
MAP_PROVIDER = os.getenv("MAP_PROVIDER", "google")


def search_url(query: str) -> dict:
    """Build a search URL for the configured map provider."""
    q = query.replace(' ', '+')

    if MAP_PROVIDER == "baidu":
        url = f"https://map.baidu.com/search/{q}"
    elif MAP_PROVIDER == "amap":
        url = f"https://uri.amap.com/search?keyword={q}"
    else:
        url = f"https://www.google.com/maps/search/{q}"

    return {"url": url, "provider": MAP_PROVIDER}


def directions_url(origin: str, destination: str, mode: str = "transit") -> dict:
    """Build a directions URL for the configured map provider."""
    o = origin.replace(' ', '+')
    d = destination.replace(' ', '+')

    # Mode mapping
    baidu_modes = {"driving": "driving", "transit": "transit", "walking": "walking", "bicycling": "riding"}
    amap_modes = {"driving": "car", "transit": "bus", "walking": "walk", "bicycling": "ride"}

    if MAP_PROVIDER == "baidu":
        bm = baidu_modes.get(mode, "transit")
        url = f"https://map.baidu.com/direction?origin={o}&destination={d}&mode={bm}"
    elif MAP_PROVIDER == "amap":
        am = amap_modes.get(mode, "bus")
        url = f"https://uri.amap.com/navigation?from={o}&to={d}&mode={am}"
    else:
        url = f"https://www.google.com/maps/dir/{o}/{d}/@?travelmode={mode}"

    return {"url": url, "provider": MAP_PROVIDER}


def pin_url(lat: float, lng: float, label: str = "") -> str:
    """Build a URL to show a single pin on the map."""
    if MAP_PROVIDER == "baidu":
        return f"https://api.map.baidu.com/marker?location={lat},{lng}&title={label}&output=html"
    elif MAP_PROVIDER == "amap":
        return f"https://uri.amap.com/marker?position={lng},{lat}&name={label}"
    else:
        return f"https://www.google.com/maps?q={lat},{lng}"
