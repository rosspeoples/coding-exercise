from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, HttpUrl
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from urllib.parse import urlparse
import secrets
import string

app = FastAPI()

# Behold, the database!
#db = {"abc123": "https://example.com"} 
db = {} # start with empty "database" :P

# origins = ["http://localhost:3000"]
origins = ["*"] # for local development environment

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

class CommonHeaders(BaseModel):
    host: str

class URLRequest(BaseModel):
    url: HttpUrl

@app.post("/api/shorten")
def shorten_url(request: URLRequest, headers: Annotated[CommonHeaders, Header()]):
    short_code = store_url_in_database(request.url)
    return {"short_code": short_code, f"short_url": f"http://{headers.host}/{short_code}", "original_url": request.url }

@app.get("/{short_code}")
def redirect(short_code: str):
    if short_code in db:
        return RedirectResponse(url=db[short_code])
    raise HTTPException(status_code=404, detail="Short code not found")

def generate_short_code():
    """Generate a six character short code"""
    alphabet = string.ascii_lowercase + string.digits
    short_code = ''.join(secrets.choice(alphabet) for i in range(6))

    while short_code in db:
        short_code = ''.join(secrets.choice(alphabet) for i in range(6))
        
    return short_code

def store_url_in_database(url: str) -> str:
    """Generate a short code, store the URL in the database, and return the short code."""
    short_code = generate_short_code()
    db[short_code] = url
    return short_code