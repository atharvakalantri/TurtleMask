
"use strict";

/*
  TurtleMask frontend prototype.
  Demo login:
  Email: demo@turtlemask.com
  Password: Turtle123

  This does not use a real database or authentication service.
*/

const DEMO_EMAIL = "demo@turtlemask.com";
const DEMO_PASSWORD = "Turtle123";

/* ---------------- LOGIN / SIGN-UP PAGE ---------------- */

const authForm = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const submitButton = document.getElementById("submitButton");
const authMessage = document.getElementById("authMessage");
const nameGroup = document.getElementById("nameGroup");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const fillDemoButton = document.getElementById("fillDemo");
const demoBox = document.getElementById("demoBox");

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;

  if (!authForm) return;

  authMessage.textContent = "";

  const isSignup = mode === "signup";

  loginTab.classList.toggle("active", !isSignup);
  signupTab.classList.toggle("active", isSignup);

  authTitle.textContent = isSignup ? "Create an account" : "Welcome back";

  authSubtitle.textContent = isSignup
    ? "Enter your details to explore the TurtleMask prototype."
    : "Log in to continue to your privacy workspace.";

  submitButton.textContent = isSignup ? "Create account" : "Log in";

  nameGroup.hidden = !isSignup;
  fullNameInput.required = isSignup;
  passwordInput.autocomplete = isSignup
    ? "new-password"
    : "current-password";

  demoBox.hidden = isSignup;
}

if (loginTab && signupTab) {
  loginTab.addEventListener("click", () => setAuthMode("login"));
  signupTab.addEventListener("click", () => setAuthMode("signup"));
}

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const shouldShow = passwordInput.type === "password";

    passwordInput.type = shouldShow ? "text" : "password";
    togglePassword.textContent = shouldShow ? "Hide" : "Show";
  });
}

if (fillDemoButton) {
  fillDemoButton.addEventListener("click", () => {
    setAuthMode("login");
    emailInput.value = DEMO_EMAIL;
    passwordInput.value = DEMO_PASSWORD;
    authMessage.textContent = "";
    emailInput.focus();
  });
}

if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    authMessage.textContent = "";

    if (!email || !password) {
      authMessage.textContent = "Please enter your email and password.";
      return;
    }

    if (authMode === "login") {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        // Return to the homepage after successful demo login.
        window.location.href = "home.html";
      } else {
        authMessage.textContent =
          "Incorrect demo credentials. Use the demo details shown below.";
      }

      return;
    }

    const fullName = fullNameInput.value.trim();

    if (!fullName) {
      authMessage.textContent = "Please enter your full name.";
      return;
    }

    if (password.length < 6) {
      authMessage.textContent =
        "Your password must contain at least 6 characters.";
      return;
    }

    /*
      Prototype sign-up only.
      No account is created or saved to a server.
    */
    window.location.href = "home.html";
  });
}

/* ---------------- HOMEPAGE / LOGOUT ---------------- */

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    // Always return to the login/sign-up page.
    window.location.replace("index.html");
  });
}

/* ---------------- WORKSPACE NAVIGATION ---------------- */

const navButtons = document.querySelectorAll(".nav-button");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const target = button.dataset.target;
    const chatTitle = document.getElementById("chatTitle");
    const chatSubtitle = document.getElementById("chatSubtitle");

    if (chatTitle && chatSubtitle) {
      if (target === "new-chat") {
        chatTitle.textContent = "New conversation";
        chatSubtitle.textContent = "Start a fresh privacy-aware demo conversation.";
        clearConversation();
      } else if (target === "history") {
        chatTitle.textContent = "Conversation history";
        chatSubtitle.textContent =
          "This prototype does not store conversation history.";
      } else {
        chatTitle.textContent = "AI Privacy Workspace";
        chatSubtitle.textContent =
          "Write a message and preview potential sensitive information.";
      }
    }
  });
});

/* ---------------- DEMO CHAT AND PRIVACY SCANNER ---------------- */

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const scanResult = document.getElementById("scanResult");
const detectedCount = document.getElementById("detectedCount");
const clearChatButton = document.getElementById("clearChat");
const policySelect = document.getElementById("policySelect");

let totalDetected = 0;

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function scanSensitiveText(text) {
  const patterns = [
    {
      type: "Email address",
      regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
    },
    {
      type: "Possible phone number",
      regex: /(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g
    },
    {
      type: "Possible API key",
      regex: /\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,})\b/g
    }
  ];

  let redactedText = text;
  const findings = [];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern.regex);

    if (matches) {
      matches.forEach((match) => {
        if (!findings.some((item) => item.value === match)) {
          findings.push({
            type: pattern.type,
            value: match
          });
        }
      });

      redactedText = redactedText.replace(pattern.regex, "[MASKED]");
    }
  });

  return { findings, redactedText };
}

function addMessage(text, sender) {
  if (!chatMessages) return;

  const message = document.createElement("div");
  message.className = `message ${sender}`;

  // textContent prevents user input from being interpreted as HTML.
  message.textContent = text;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updatePrivacyPanel(text) {
  const result = scanSensitiveText(text);

  totalDetected += result.findings.length;

  if (detectedCount) {
    detectedCount.textContent = String(totalDetected);
  }

  if (scanResult) {
    const summary = result.findings.length
      ? result.findings.map((item) => item.type).join(", ")
      : "No matching patterns found in this message.";

    const safePreview = escapeHTML(result.redactedText);

    scanResult.innerHTML = `
      <h4>Privacy scan preview</h4>
      <p>${escapeHTML(summary)}</p>
      <p class="masked">${safePreview}</p>
    `;
  }

  return result;
}

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const userText = chatInput.value.trim();

    if (!userText) return;

    addMessage(userText, "user");

    const result = updatePrivacyPanel(userText);
    const selectedPolicy = policySelect ? policySelect.value : "balanced";

    let reply;

    if (result.findings.length > 0) {
      reply =
        `The demo scanner found ${result.findings.length} possible sensitive ` +
        `item(s). Review the masked preview in the Privacy Guard panel. ` +
        `Your selected policy is "${selectedPolicy}". No message was sent to an AI service.`;
    } else {
      reply =
        "The demo scanner did not find a matching email, phone-number, or API-key pattern. " +
        "This is only a simple local preview, not a complete privacy or security scan.";
    }

    addMessage(reply, "assistant");
    chatInput.value = "";
  });
}

function clearConversation() {
  if (chatMessages) {
    chatMessages.innerHTML = "";
  }

  if (scanResult) {
    scanResult.innerHTML = `
      <h4>Privacy scan preview</h4>
      <p>Your next message will be scanned for demo patterns.</p>
    `;
  }
}

if (clearChatButton) {
  clearChatButton.addEventListener("click", () => {
    clearConversation();
  });
}

/* ---------------- SUGGESTED EXAMPLE PROMPTS ---------------- */

const suggestionButtons = document.querySelectorAll(".suggestion-card");

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!chatInput) return;

    chatInput.value = button.dataset.prompt || button.textContent.trim();
    chatInput.focus();
  });
});

/* ---------------- TEXT / AUDIO / IMAGE INPUT MODES ---------------- */

const modeButtons = document.querySelectorAll(".mode-button");

const modePanels = {
  text: document.getElementById("textMode"),
  audio: document.getElementById("audioMode"),
  image: document.getElementById("imageMode")
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedMode = button.dataset.mode;

    modeButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    Object.entries(modePanels).forEach(([mode, panel]) => {
      if (panel) {
        panel.hidden = mode !== selectedMode;
      }
    });
  });
});

/* ---------------- MICROPHONE SPEECH TO TEXT ---------------- */

const startRecordingButton = document.getElementById("startRecording");
const stopRecordingButton = document.getElementById("stopRecording");
const audioStatus = document.getElementById("audioStatus");
const useAudioTextButton = document.getElementById("useAudioText");

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let speechRecognition = null;
let transcriptText = "";

if (SpeechRecognitionAPI) {
  speechRecognition = new SpeechRecognitionAPI();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = "en-IN";

  speechRecognition.onstart = () => {
    transcriptText = "";
    audioStatus.textContent = "Listening... speak into your microphone.";
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
  };

  speechRecognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript;

      if (result.isFinal) {
        finalText += text + " ";
      } else {
        interimText += text;
      }
    }

    transcriptText = finalText.trim();

    audioStatus.textContent =
      "Transcription: " + (finalText + interimText || "Listening...");
  };

  speechRecognition.onerror = (event) => {
    audioStatus.textContent =
      event.error === "not-allowed"
        ? "Microphone permission was denied. Allow microphone access in your browser."
        : "Speech recognition error: " + event.error;
  };

  speechRecognition.onend = () => {
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;

    if (transcriptText) {
      audioStatus.textContent =
        "Transcription ready. You can use it as your message.";
    } else if (
      audioStatus.textContent.startsWith("Listening")
    ) {
      audioStatus.textContent = "No speech was transcribed. Try again.";
    }
  };
} else {
  if (startRecordingButton) {
    startRecordingButton.disabled = true;
  }

  if (audioStatus) {
    audioStatus.textContent =
      "Speech recognition is not supported in this browser. Try a supported browser.";
  }
}

if (startRecordingButton && speechRecognition) {
  startRecordingButton.addEventListener("click", () => {
    try {
      speechRecognition.start();
    } catch (error) {
      audioStatus.textContent =
        "Recording could not start. Stop any active recording and try again.";
    }
  });
}

if (stopRecordingButton && speechRecognition) {
  stopRecordingButton.addEventListener("click", () => {
    speechRecognition.stop();
  });
}

if (useAudioTextButton) {
  useAudioTextButton.addEventListener("click", () => {
    if (!transcriptText) {
      audioStatus.textContent =
        "Record some speech first, then use the transcribed text.";
      return;
    }

    chatInput.value = transcriptText;

    // Switch back to the text input so the user can review and send it.
    document.querySelector('[data-mode="text"]').click();
    chatInput.focus();
  });
}

/* ---------------- IMAGE UPLOAD AND OCR ---------------- */

const imageFileInput = document.getElementById("imageFile");
const imagePreview = document.getElementById("imagePreview");
const extractImageTextButton = document.getElementById("extractImageText");
const imageStatus = document.getElementById("imageStatus");
const extractedTextArea = document.getElementById("extractedText");
const useImageTextButton = document.getElementById("useImageText");

let selectedImageFile = null;

if (imageFileInput) {
  imageFileInput.addEventListener("change", () => {
    const file = imageFileInput.files[0];

    selectedImageFile = null;
    extractImageTextButton.disabled = true;
    imagePreview.hidden = true;
    extractedTextArea.value = "";
    imageStatus.textContent = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      imageStatus.textContent = "Please select a valid image file.";
      return;
    }

    selectedImageFile = file;
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.hidden = false;
    extractImageTextButton.disabled = false;
    imageStatus.textContent = "Image ready for text extraction.";
  });
}

if (extractImageTextButton) {
  extractImageTextButton.addEventListener("click", async () => {
    if (!selectedImageFile) return;

    if (!window.Tesseract) {
      imageStatus.textContent =
        "OCR library unavailable. Check your internet connection and reload the page.";
      return;
    }

    extractImageTextButton.disabled = true;
    imageStatus.textContent = "Extracting text from the image...";

    try {
      const result = await Tesseract.recognize(
        selectedImageFile,
        "eng",
        {
          logger: (progress) => {
            if (progress.status === "recognizing text") {
              imageStatus.textContent =
                "Recognizing text: " +
                Math.round((progress.progress || 0) * 100) +
                "%";
            }
          }
        }
      );

      extractedTextArea.value = result.data.text.trim();

      imageStatus.textContent = extractedTextArea.value
        ? "Text extracted. Review it before using it."
        : "No text found. Try a clearer image.";

    } catch (error) {
      imageStatus.textContent =
        "Could not extract text. Try another image.";
    } finally {
      extractImageTextButton.disabled = false;
    }
  });
}

if (useImageTextButton) {
  useImageTextButton.addEventListener("click", () => {
    const extractedText = extractedTextArea.value.trim();

    if (!extractedText) {
      imageStatus.textContent =
        "Extract text from an image or enter some text first.";
      return;
    }

    chatInput.value = extractedText;

    // Send extracted text through the existing privacy scanner.
    document.querySelector('[data-mode="text"]').click();
    chatInput.focus();
  });
}
