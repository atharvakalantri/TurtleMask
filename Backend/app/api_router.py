from sqlalchemy.orm import Session
import openai
from google import genai
import anthropic

from . import models, security, session_store

def call_external_ai_provider(
    db: Session,
    user_id: str,
    provider_name: models.ProviderEnum,
    sanitized_prompt: str,
    ram_ticket_id: str = None
) -> dict:
    """
    1. Finds user's encrypted API key in DB.
    2. Decrypts it in RAM.
    3. Calls OpenAI, Gemini, or Claude with the sanitized prompt.
    4. Unmasks the response if a RAM session ticket was used.
    """
    # STEP 1: Fetch encrypted key from database Vault
    db_model = db.query(models.ConnectedModel).filter(
        models.ConnectedModel.user_id == user_id,
        models.ConnectedModel.provider_name == provider_name,
        models.ConnectedModel.is_active == True
    ).first()

    if not db_model:
        return {
            "status": "ERROR",
            "message": f"No active API key found for {provider_name.value} in Vault! Please connect your API key on Page 2."
        }

    # STEP 2: Decrypt key in RAM temporarily
    try:
        raw_api_key = security.decrypt_api_key_in_ram(db_model.encrypted_api_key)
    except Exception as e:
        return {"status": "ERROR", "message": f"Failed to decrypt API key: {str(e)}"}

    ai_response_text = ""

    # STEP 3: Route to the correct External AI Provider SDK
    try:
        if provider_name == models.ProviderEnum.OPENAI:
            client = openai.OpenAI(api_key=raw_api_key)
            completion = client.chat.completions.create(
                model="gpt-4o-mini",  # Fast and efficient default
                messages=[{"role": "user", "content": sanitized_prompt}]
            )
            ai_response_text = completion.choices[0].message.content

        elif provider_name == models.ProviderEnum.GEMINI:
            client = genai.Client(api_key=raw_api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=sanitized_prompt,
            )
            ai_response_text = response.text

        elif provider_name == models.ProviderEnum.ANTHROPIC:
            client = anthropic.Anthropic(api_key=raw_api_key)
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": sanitized_prompt}]
            )
            ai_response_text = message.content[0].text

        elif provider_name == models.ProviderEnum.OLLAMA_LOCAL:
            # Local fallback option
            from . import ollama_brain
            ai_response_text = ollama_brain.ask_local_gemma_fallback(sanitized_prompt)

        else:
            return {"status": "ERROR", "message": "Unknown AI provider selected."}

    except Exception as e:
        return {"status": "ERROR", "message": f"External API Error from {provider_name.value}: {str(e)}"}

    # STEP 4: Unmask response locally if a RAM ticket exists, and shred RAM!
    final_output = ai_response_text
    if ram_ticket_id:
        final_output = session_store.unmask_response_and_wipe_ram(ram_ticket_id, ai_response_text)

    return {
        "status": "SUCCESS",
        "provider": provider_name.value,
        "raw_response_from_external_ai": ai_response_text,
        "unmasked_response_shown_to_user": final_output
    }