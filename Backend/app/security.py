import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

VAULT_KEY = os.getenv("VAULT_MASTER_KEY")
cipher_suite = Fernet(VAULT_KEY.encode())

def encrypt_api_key(raw_api_key: str) -> str:
    return cipher_suite.encrypt(raw_api_key.encode()).decode()

def decrypt_api_key_in_ram(encrypted_api_key: str) -> str:
    return cipher_suite.decrypt(encrypted_api_key.encode()).decode()

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGO)