from fastapi import FastAPI, Depends, HTTPException, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import models, schemas, security, session_store, ml_pipeline, ollama_brain, extractor, api_router
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Turtle Mask - Complete Backend, ML & API Gateway")
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
    return {"status": "Turtle Mask Complete Gateway is active! 🐢🛡️🧠🚀"}

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

@app.post("/ml/analyze-prompt")
def analyze_and_sanitize_prompt(req: schemas.PromptScanRequest):
    injection_result = ml_pipeline.check_prompt_injection(req.prompt_text)
    if injection_result["risk_level"] == "HIGH":
        return {
            "action": "HARD_BLOCK",
            "reason": "High-Risk Prompt Injection Detected!",
            "injection_analysis": injection_result
        }

    working_text = req.prompt_text
    if injection_result["risk_level"] == "MEDIUM":
        working_text = ollama_brain.sanitize_medium_risk_prompt(working_text)

    pii_found = ml_pipeline.scan_for_pii(working_text)
    gemma_secret_check = ollama_brain.detect_unstructured_secrets(working_text)

    if req.ui_mode == models.UIModeEnum.TECH_STRICT:
        if pii_found or gemma_secret_check.get("has_confidential_code_or_secrets"):
            return {
                "action": "HARD_BLOCK_TECH_STRICT",
                "ui_banner": "Red Alert: Confidential Data or Secret Detected! External API submission blocked.",
                "offending_pii": pii_found,
                "gemma_secret_analysis": gemma_secret_check,
                "tip": "You can run this prompt offline using Local Ollama Gemma 4 instead."
            }
        return {
            "action": "SAFE_TO_SEND",
            "sanitized_prompt": working_text,
            "injection_analysis": injection_result
        }

    mask_result = ollama_brain.generate_smart_dummy_mask(working_text, pii_found)
    ram_ticket_id = session_store.save_dummy_mapping_in_ram(mask_result["dummy_mapping"])

    return {
        "action": "AUTO_MASKED_PREVIEW",
        "original_prompt": req.prompt_text,
        "masked_prompt_for_external_ai": mask_result["masked_text"],
        "dummy_mapping_saved_in_ram": mask_result["dummy_mapping"],
        "ram_session_ticket_id": ram_ticket_id,
        "injection_analysis": injection_result,
        "pii_detected_count": len(pii_found)
    }

@app.post("/ml/extract-file")
async def extract_and_scan_file(
    ui_mode: models.UIModeEnum = models.UIModeEnum.NORMAL_MASK,
    file: UploadFile = File(...)
):
    file_bytes = await file.read()
    extracted_text = extractor.extract_text_from_file(file.filename, file_bytes)

    scan_req = schemas.PromptScanRequest(prompt_text=extracted_text, ui_mode=ui_mode)
    scan_results = analyze_and_sanitize_prompt(scan_req)

    return {
        "filename": file.filename,
        "extracted_text_preview": extracted_text[:300],
        "security_scan": scan_results
    }

# ==========================================
# NEW API-FEATURE CHAT PROXY DOOR! 🌐🤖
# ==========================================

@app.post("/ai/chat")
def secure_ai_chat_proxy(req: schemas.ChatProxyRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")

    ui_mode = user.ui_mode

    injection_result = ml_pipeline.check_prompt_injection(req.prompt_text)
    if injection_result["risk_level"] == "HIGH":
        return {
            "action": "HARD_BLOCK",
            "reason": "High-Risk Prompt Injection Attack Detected by DeBERTa-v3!",
            "injection_analysis": injection_result
        }

    working_text = req.prompt_text
    if injection_result["risk_level"] == "MEDIUM":
        working_text = ollama_brain.sanitize_medium_risk_prompt(working_text)

    pii_found = ml_pipeline.scan_for_pii(working_text)
    gemma_secret_check = ollama_brain.detect_unstructured_secrets(working_text)

    ram_ticket_id = None
    sanitized_prompt = working_text

    if ui_mode == models.UIModeEnum.TECH_STRICT:
        if pii_found or gemma_secret_check.get("has_confidential_code_or_secrets"):
            return {
                "action": "HARD_BLOCK_TECH_STRICT",
                "ui_banner": "Red Alert: Confidential Enterprise Data or Secret Key detected. Request halted and blocked from external API.",
                "offending_pii": pii_found,
                "gemma_secret_analysis": gemma_secret_check,
                "offline_fallback_suggestion": "You can run this prompt securely offline using Local Ollama Gemma 4."
            }
    else:
        mask_result = ollama_brain.generate_smart_dummy_mask(working_text, pii_found)
        sanitized_prompt = mask_result["masked_text"]
        ram_ticket_id = session_store.save_dummy_mapping_in_ram(mask_result["dummy_mapping"])

    api_result = api_router.call_external_ai_provider(
        db=db,
        user_id=req.user_id,
        provider_name=req.provider_name,
        sanitized_prompt=sanitized_prompt,
        ram_ticket_id=ram_ticket_id
    )

    return {
        "ui_mode_applied": ui_mode,
        "original_prompt": req.prompt_text,
        "sanitized_prompt_sent_to_external_api": sanitized_prompt,
        "ai_response_result": api_result
    }