import hashlib
import secrets


def hash_password(password: str, salt: str | None = None) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256 and return salt$hexhash."""
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${pwd_hash.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, hexhash = hashed.split("$", 1)
    except ValueError:
        return False
    test = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100_000
    ).hex()
    return secrets.compare_digest(test, hexhash)
