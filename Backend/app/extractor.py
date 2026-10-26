import io
from pypdf import PdfReader
import docx

# We load EasyOCR lazily only when an image is uploaded so your server starts super fast!
_ocr_reader = None

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        _ocr_reader = easyocr.Reader(['en'], gpu=False)
    return _ocr_reader

def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """
    Takes any uploaded file (TXT, PDF, DOCX, PNG/JPG) and turns it into plain text!
    """
    fname = filename.lower()

    # 1. Plain Text File (.txt)
    if fname.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")

    # 2. PDF File (.pdf)
    elif fname.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages_text)

    # 3. Word Document (.docx)
    elif fname.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])

    # 4. Image / Screenshot (.png, .jpg, .jpeg) -> Local EasyOCR
    elif fname.endswith((".png", ".jpg", ".jpeg")):
        reader = get_ocr_reader()
        results = reader.readtext(file_bytes, detail=0)
        return " ".join(results)

    else:
        return "Unsupported file format."