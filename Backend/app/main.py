from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import models, schemas, security, session_store
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Turtle Mask - Backend Feature")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Turtle Mask Backend is running! 🐢🛡️"}

@app.post("/signup")
def sign_up(user_data: schemas.UserSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered!")

    new_user = models.User(
        email=user_data.email,
        password_hash=security.hash_password(user_data.password),
        ui_mode=user_data.ui_mode
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Account created successfully!",
        "user_id": new_user.id,
        "email": new_user.email,
        "ui_mode": new_user.ui_mode
    }

@app.post("/login")
def log_in(login_data: schemas.UserLoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not security.verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong email or password!")

    token = security.create_access_token({"sub": user.id, "ui_mode": user.ui_mode.value})
    response.set_cookie(key="access_token", value=f"Bearer {token}", httponly=True)

    return {
        "message": "Logged in!",
        "user_id": user.id,
        "ui_mode": user.ui_mode
    }

@app.post("/vault/connect")
def connect_ai_model(vault_data: schemas.ConnectModelRequest, db: Session = Depends(get_db)):
    encrypted_key = security.encrypt_api_key(vault_data.raw_api_key)

    new_model = models.ConnectedModel(
        user_id=vault_data.user_id,
        provider_name=vault_data.provider_name,
        encrypted_api_key=encrypted_key,
        is_active=True
    )
    db.add(new_model)
    db.commit()

    return {
        "message": f"Success! Your {vault_data.provider_name.value} key is encrypted and locked in the Vault."
    }

@app.post("/test-ram-whiteboard")
def test_whiteboard():
    fake_mapping = {"Alex": "Rahul", "Acme Corp": "Infosys"}
    ticket = session_store.save_dummy_mapping_in_ram(fake_mapping)
    fake_ai_reply = "Hello Alex! How is work going at Acme Corp today?"
    real_reply_shown_to_user = session_store.unmask_response_and_wipe_ram(ticket, fake_ai_reply)
    
    return {
        "what_external_ai_saw": fake_ai_reply,
        "what_user_sees_on_screen": real_reply_shown_to_user,
        "is_ram_wiped_clean_now": ticket not in session_store._RAM_WHITEBOARD
    }