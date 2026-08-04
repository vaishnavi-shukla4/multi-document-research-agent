"""
JWT authentication via Supabase JWKS (asymmetric ES256/RS256 signing).

Usage:
    from auth import get_current_user
    ...
    @app.get("/protected")
    def protected(user_id: str = Depends(get_current_user)):
        ...

The only valid source of user_id is this dependency — never trust a
user_id from the request body or query parameters.
"""

import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# PyJWKClient caches the JWKS and rotates automatically on key changes.
_jwk_client = PyJWKClient(JWKS_URL)


async def get_current_user(authorization: str = Header(...)) -> str:
    """
    FastAPI dependency: verifies the Supabase JWT and returns the user_id (sub).

    Raises HTTP 401 if the token is missing, malformed, expired, or has an
    invalid signature.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header (expected: Bearer <token>)",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
        user_id: str = payload["sub"]
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")
