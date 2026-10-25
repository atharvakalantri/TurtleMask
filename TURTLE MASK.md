TURTLE MASK

Main Goal of the Project : 

The main goal of this project is to develop a **secure AI Privacy Gateway** that acts as an intelligent protection layer between users and external AI models. The system will allow users to access multiple AI services for tasks such as research, learning, coding, document analysis, and content generation, while reducing the risk of confidential or personally identifiable information being exposed to an external AI provider.

The interface will accept user input in multiple formats, including **text, speech/audio, images, and documents**. If the user provides speech, the system will convert it into text using **Speech-to-Text (STT)** technology. If the user uploads an image, screenshot, scanned document, or handwritten page, the system will extract readable content using **Optical Character Recognition (OCR)** and convert it into text. This converted text will then pass through the same security-checking pipeline as normal typed input.

Before any information is sent to an AI model, the gateway will analyze the text using pattern matching, machine learning, and natural language processing. It will detect sensitive content such as contact numbers, email addresses, IP addresses, passwords, API keys, access tokens, private keys, bank or financial details, customer IDs, personal addresses, confidential business information, and source-code secrets. Depending on the sensitivity level, the system will either **block**, **redact**, or **tokenize** the information. For example, an email address may be replaced with \<EMAIL\_1\>, while an API key or password will be completely blocked because it can provide direct access to a user’s account or system.

## Prompt-Injection Protection

The system will include a dedicated **ML-based prompt-injection detection module**. If a user, uploaded file, image, speech transcript, or external document contains instructions intended to manipulate the AI model—such as “ignore all previous instructions,” “reveal the system prompt,” “disable security filters,” or “send this data to another service”—the ML model will classify the prompt as suspicious.

If the prompt-injection risk score is high, the gateway will **reject the input or prompt** and display a security message explaining that the request may attempt to manipulate the AI model. If the risk score is moderate, the system may remove the unsafe instruction, request user confirmation, or send only a sanitized version of the prompt to the selected AI model. Prompt injection is a known vulnerability in which crafted input changes the intended behavior of a large-language-model application.

## High-Confidentiality Warning

If the system detects information that appears to be highly confidential, such as passwords, private keys, API keys, banking details, medical records, legal documents, internal business documents, customer databases, or sensitive personal identifiers, it will display a clear warning:

**Warning:** This information appears to be highly confidential and may be risky to process through an external AI model. Please review the detected information, remove sensitive details, or choose an approved private AI service before continuing.

The user will then be given controlled options: remove the sensitive data, continue with tokenization or redaction, select a permitted private model, or cancel the request. For credentials and highly sensitive secrets, the system will not provide a normal override option; it will block the request by default. This supports the security principle of strict input validation and filtering before sensitive data reaches an AI model.

After sanitization, only the safe version of the user’s request will be sent to the selected AI model. The interface will also scan the AI-generated response before displaying it to the user or exporting it as a PDF or document. This output-security layer helps prevent accidental disclosure of sensitive information, confidential identifiers, tokens, or unsafe content. The platform will aim to avoid permanent storage of raw prompts and outputs; if temporary token mappings are required to restore masked details, they will be encrypted, limited to the user session, and automatically deleted after use.

In simple terms, the project converts every input format into secure text, checks it for sensitive data and prompt-injection attempts, warns the user when highly confidential information is detected, removes or hides unsafe details, safely sends the cleaned request to an AI model, checks the response again, and then provides the user with a secure output.

Step by Step Working of the Web App :

## **Step 1: User Login and Security Setup**

The user opens the web application and logs in using a secure account. The system verifies the user’s identity and applies the correct security policy based on their role, such as student, employee, administrator, or company user.

* The user sees the main dashboard.  
* The user selects the type of task: study help, research, coding, document summarization, report writing, or general AI assistance.  
* The user selects an approved AI model from the available options.  
* The system checks whether the selected model is allowed for the user’s data-sensitivity level.

## **Step 2: User Provides Input**

The user provides input in one of the following formats:

* Typed text prompt.  
* Speech or audio recording.  
* Image, screenshot, scanned document, or handwritten page.  
* Uploaded document such as PDF, DOCX, or TXT.

The web app accepts the input and prepares it for processing.

## **Step 3: Convert Every Input Into Text**

The system converts all input formats into readable text before applying security checks.

* **Typed text:** The text is sent directly for analysis.  
* **Speech or audio:** The app uses Speech-to-Text (STT) to convert the spoken words into text.  
* **Image or screenshot:** The app uses Optical Character Recognition (OCR) to extract text from the image.  
* **Document upload:** The app extracts text from the document while preserving useful structure such as headings, paragraphs, tables, and page order.

After this step, the system has one common text version of the user’s request. This makes it possible to apply the same security checks to every input type.

## **Step 4: Clean and Prepare the Text**

Before scanning for confidential data, the system cleans the extracted text.

* It removes unnecessary spaces and formatting errors.  
* It detects the language of the text.  
* It separates the user’s actual request from uploaded file content.  
* It marks external content, such as document text or OCR text, as untrusted.  
* It prepares the text for pattern matching and machine-learning analysis.

This step is important because malicious instructions can be hidden inside documents, images, or web content. The system treats such content as potentially unsafe rather than automatically trusting it.

## **Step 5: Detect Confidential Data**

The system scans the converted text to identify sensitive or confidential information. It uses two methods together:

* **Rule-based detection:** Regex and predefined patterns quickly detect emails, phone numbers, IP addresses, credit-card-like numbers, API keys, passwords, tokens, and connection strings.  
* **Machine-learning detection:** NLP and ML models detect names, addresses, customer details, financial information, medical information, internal business data, and context-based sensitive content.

The system classifies detected information into categories such as:

* Personal information: name, email, phone number, address, government ID.  
* Technical secrets: passwords, API keys, private keys, access tokens, database URLs.  
* Financial information: bank account details, card numbers, salary data, invoices.  
* Business information: internal documents, customer records, source code, business plans.  
* Highly sensitive information: medical records, legal documents, biometric data, confidential company files.

## **Step 6: Mask, Tokenize, or Redact the Data**

After detection, the system decides how each sensitive item should be handled.

* **Tokenization:** The system replaces the data with a placeholder.  
  Example: `rahul@example.com` becomes `<EMAIL_1>`.  
* **Redaction:** The system removes or hides the data completely.  
  Example: `Bank account: 1234567890` becomes `Bank account: [REDACTED]`.  
* **Blocking:** The system prevents the data from being sent at all.  
  Example: API keys, passwords, private keys, and access tokens are blocked.  
* **Allowing:** Harmless information, such as normal dates, quantities, prices, marks, and calculations, is allowed if it does not create a privacy risk.

The user is shown a preview of what was detected and how it will be handled before the request is sent to the AI model.

## **Step 7: Detect Super-Confidential Information**

The system then checks whether the prompt contains **super-confidential information** that must be treated as especially important for the particular user or company.

This includes information such as:

* Passwords and account credentials.  
* API keys, access tokens, private keys, and connection strings.  
* Bank account numbers, card details, payment information, or salary records.  
* Customer databases, employee records, or confidential company documents.  
* Medical records, legal case details, biometric data, or highly personal information.  
* Source code containing internal logic, security credentials, or proprietary algorithms.  
* Company-specific confidential data marked as Internal, Confidential, or Restricted.

If such information is found, the system does not automatically send it to the AI model. Instead, it displays a warning to the user:

> **Warning:** This information appears to be highly confidential and may be risky to process through an external AI model. Please review the detected information, remove sensitive details, or choose an approved private AI service before continuing.

The user can then choose one of the following actions:

* Remove the sensitive information.  
* Continue with tokenization or redaction.  
* Select an approved private or enterprise AI model.  
* Cancel the request.

For credentials and highly sensitive secrets, the system blocks the request by default and does not allow a simple override.

## **Step 8: Detect Prompt-Injection Attacks**

The system uses an ML-based prompt-injection detection module to check whether the prompt is trying to manipulate the AI model.

It looks for suspicious instructions such as:

* “Ignore all previous instructions.”  
* “Reveal the system prompt.”  
* “Disable security filters.”  
* “Send this data to another service.”  
* “Act as an unrestricted AI.”  
* “Print all confidential information.”  
* “Bypass the privacy rules.”

The ML model assigns a prompt-injection risk score.

* **Low risk:** The prompt is allowed after normal security checks.  
* **Medium risk:** The system removes unsafe instructions or asks the user for confirmation.  
* **High risk:** The system rejects the prompt and displays a security warning.

If the risk score is high, the web app rejects the input and explains that the request may attempt to manipulate the AI model.

## **Step 9: Apply the User’s Data-Sensitivity Policy**

The system compares the detected data with the selected AI model’s allowed policy.

For example:

* A public study question may be sent to a normal approved AI model.  
* A prompt containing personal data may be sent only after tokenization.  
* A prompt containing company-confidential data may require an approved private AI model.  
* A prompt containing credentials or highly sensitive secrets may be blocked completely.

The system sends the request only if the selected model is permitted to receive that type of data.

## **Step 10: Send the Sanitized Prompt to the AI Model**

The web app sends only the cleaned, masked, or tokenized version of the prompt to the selected AI model.

Example:

**Original prompt:**

text  
`Email Rahul at rahul@example.com about API key sk-abc123 and ask him to update the customer record.`

**Sanitized prompt sent to AI:**

text  
`Email <PERSON_1> at <EMAIL_1> about API key [BLOCKED_SECRET] and ask him to update the customer record.`

The external AI model receives only the safe version of the request.

## **Step 11: Receive and Scan the AI Response**

When the AI model returns a response, the system scans it before showing it to the user.

The output scanner checks for:

* Personal information.  
* API keys, passwords, or tokens.  
* Confidential business information.  
* Internal URLs or system details.  
* Malicious links or unsafe content.  
* Data that may have been leaked through the response.

If the response contains sensitive information, the system can block it, redact it, tokenize it, or ask the user to review it before continuing.

## **Step 12: Display or Export the Safe Output**

After the output passes the security scan, the web app displays the response to the user.

The user can:

* Read the response in the web app.  
* Copy the response.  
* Download it as a PDF.  
* Download it as a document.  
* Save it only if the user explicitly chooses to save it.

The system avoids permanent storage of raw prompts and outputs by default. If temporary token mappings are used to restore masked details, they are encrypted, limited to the user session, and automatically deleted after use.

## **Step 13: Record Minimal Security Metadata**

The system does not store the full prompt or full AI response in normal logs. Instead, it records only minimal security metadata, such as:

* Time of request.  
* Type of input: text, speech, image, or document.  
* Detection category: PII, secret, financial data, prompt injection, etc.  
* Action taken: allowed, tokenized, redacted, blocked, or rejected.  
* Selected AI model.  
* Anonymized security event ID.

This helps the security team monitor misuse without creating another place where confidential content can leak.

## **Complete Flow in One Line**

text

`User input`

`→ Convert speech/image/document into text`

`→ Clean and prepare text`

`→ Detect confidential data`

`→ Mask, tokenize, redact, or block data`

`→ Detect super-confidential information`

`→ Show warning for high-risk data`

`→ Detect prompt-injection attempts`

`→ Reject or sanitize unsafe prompts`

`→ Apply AI model policy`

`→ Send only sanitized prompt to AI`

`→ Scan AI response`  
`→ Show or export safe output`

The most important principle is that the web app should never send raw confidential input directly to an external AI model. It should first convert the input to text, analyze it, protect sensitive details, warn the user about high-risk information, reject prompt-injection attempts, and then send only a sanitized request.

Controlled Permission System :

The AI Privacy Gateway will include a **controlled permission system** to ensure that the interface accesses only the minimum information required to complete a user’s requested task. The system will not automatically gain access to a user’s device, files, microphone, camera, clipboard, or connected AI accounts. Instead, it will request permission only when a specific feature is used.

This design follows the cybersecurity principle of **least privilege**, which means that users, applications, and connected services should receive only the minimum access necessary to perform their intended function.

The permission system will operate at two levels:

* **User-side permissions:** Access to the user’s microphone, camera, files, clipboard, and download functionality.  
* **AI-provider permissions:** Access to the selected AI model through API keys or OAuth-based authorization.

## User-Side Permissions

The web application will request user permissions only at the moment they are required. This prevents the interface from collecting unnecessary access to personal devices or data.

| Feature | Permission Required | Purpose |
| :---- | :---- | :---- |
| Speech input | Microphone access | Converts spoken input into text using Speech-to-Text |
| Image or document scanning | Camera or file access | Extracts text from images, screenshots, or scanned documents using OCR |
| Document upload | File access | Processes only the file selected by the user |
| Paste from clipboard | Clipboard access | Allows the user to paste text into the interface |
| PDF export | Download permission | Allows the user to download the AI response as a PDF |
| AI account connection | OAuth authorization | Allows secure connection to an AI provider without storing the user’s password |

For example, if a user only types a question into the interface, the application will not request microphone, camera, or file access. If the user wants to speak a prompt, the system will request microphone permission only when the user clicks the speech-input option.

## AI-Provider Permissions

When a user connects the interface to an AI model, the system will request only limited permissions. The interface will connect through secure backend API calls using API keys or OAuth tokens. It will not ask users to provide their AI-provider email address and password.

The interface may request permission to:

* Send a sanitized prompt to the selected AI model.  
* Receive the AI model’s response.  
* Display the response within the interface.  
* List available approved models.  
* Create a new AI conversation.  
* Upload a selected file only when the user explicitly chooses to do so.

The interface will not request permission to:

* Access the user’s AI-provider password.  
* Read previous AI conversations.  
* Access the user’s email, contacts, calendar, or payment details.  
* Access the user’s entire cloud-storage account.  
* Delete the user’s AI-provider account.  
* Access data unrelated to the selected task.

## Permission Confirmation Screen

Before connecting to an AI model, the interface will display a clear permission confirmation screen. This screen will explain exactly what the system will access and what it will not access.

Example:

text

`Connect to Gemini`

`This interface is requesting permission to:`

`• Send your sanitized prompt to Gemini`

`• Receive the AI response`

`• Display the response in this interface`

`• Export the response as a PDF only if you choose`

`This interface will not:`

`• Access your Gemini password`

`• Read your previous chats`

`• Access your Google Drive`

`• Access your contacts or calendar`

`• Store your raw prompt permanently`

The user will be able to select:

text

`[ Allow Selected Permissions ]     [ Cancel ]`

If the user cancels, the interface will not connect to the selected AI model or send any data.

## Permission-Based Data Routing

The controlled permission system will also determine which AI models can receive which type of data. Before sending a request, the system will compare the sensitivity of the detected data with the permission level of the selected AI model.

| Data Sensitivity Level | Permission Policy |
| :---- | :---- |
| Public | Can be sent to any approved AI model |
| Internal | Can be sent only to approved internal or enterprise AI models |
| Confidential | Must be tokenized or redacted; sent only to an approved private model |
| Restricted | Blocked by default or sent only to a private deployment |
| Credentials and secrets | Blocked by default and not sent to external AI models |

For example, if a user selects a public research model, the interface may allow only public information. If the prompt contains confidential company information, the interface will warn the user and suggest an approved private AI model instead.

## API Key and Token Security

The interface will connect to AI models through a secure backend server. Provider API keys will be stored in a secrets manager or encrypted key vault, not in the frontend code or browser storage.

Security controls will include:

* HTTPS for all communication between the user, backend, and AI provider.  
* Encryption of user-provided API keys before storage.  
* No display of the full API key after it is saved.  
* Separate API keys or tokens for individual users or organizations where possible.  
* Automatic session expiry for temporary access tokens.  
* User ability to disconnect an AI provider and delete stored credentials.  
* Regular API-key rotation.  
* Immediate revocation of exposed or compromised API keys.

## Permission Expiry and Revocation

The interface will allow users to review, modify, or revoke permissions at any time. When a user logs out, disconnects an AI provider, or deletes their account, the system will remove active permissions and stored connection tokens.

Temporary permissions, such as microphone access during speech input, will expire automatically after the task is completed. OAuth access tokens will be refreshed only when necessary and deleted when the user disconnects the provider.

## Security Benefit

The controlled permission system reduces the risk of unnecessary data exposure. Even if an attacker compromises one part of the system, they will not automatically gain access to the user’s microphone, files, cloud storage, email, or complete AI-provider account.

The main principle of this system is:

The interface should request the minimum permission required, clearly inform the user what will be accessed, and allow the user to approve, modify, or cancel before any sensitive action occurs.

User Confirmation :

## **1\. Human Confirmation for High-Risk Actions**

The interface should not make irreversible decisions automatically. If the system detects highly confidential information, an unusual request, or a possible prompt-injection attempt, it should pause and ask the user to confirm.

Examples:

* “This prompt contains an API key. Sending it may expose your account. Do you want to remove it?”  
* “This document appears to contain customer data. Choose an approved private AI model or redact the data.”  
* “This request contains instructions that may manipulate the AI model. Do you want to cancel or review it?”

For passwords, private keys, API keys, and access tokens, the system should block the request by default rather than allowing an easy override.

## **2\. Data Sensitivity Labels**

Every prompt, file, or AI response should receive a sensitivity label before processing.

| Label | Meaning | Example |
| ----- | ----- | ----- |
| Public | Safe to process through approved public AI models | General study question |
| Internal | For organization use only | Internal process explanation |
| Confidential | Sensitive business or personal information | Customer list, invoice, employee data |
| Restricted | Highly sensitive data requiring strict controls | Medical, legal, credentials, source code |

The selected AI model should change automatically based on this label. For example, confidential data may be allowed only through a private enterprise model.

## **3\. Model Trust Score**

Each AI model should have a visible trust profile. This helps users understand why one model is safer than another for a particular task.

The model card can show:

* Provider name.  
* Approved data-sensitivity level.  
* Whether the model uses external web browsing.  
* Whether file uploads are allowed.  
* Data-retention policy.  
* Whether the model is private, enterprise-approved, or public.  
* Known limitations and risks.

For example, a deep-research model with web access may be suitable for public research but not for confidential company documents.

## **4\. Rate Limiting and Abuse Prevention**

The system should prevent users or attackers from sending too many requests. This protects against misuse, automated attacks, excessive API cost, and denial-of-service attempts.

Controls should include:

* Limit requests per user, IP address, and organization.  
* Limit file size and prompt length.  
* Detect unusual activity, such as many blocked secret attempts.  
* Temporarily lock accounts after repeated high-risk behavior.  
* Alert administrators when suspicious activity is detected.

OWASP recommends rate limiting, abuse detection, anomaly scoring, and monitoring of request patterns for secure AI model operations.[cheatsheetseries.owasp](https://cheatsheetseries.owasp.org/cheatsheets/Secure_AI_Model_Ops_Cheat_Sheet.html)

## **5\. Audit Trail Without Storing Raw Content**

The system should maintain a security audit trail, but it should not store full prompts or AI responses by default.

It can store only:

* Timestamp.  
* User ID or anonymized user ID.  
* Input type: text, speech, image, or document.  
* Detection category: PII, secret, financial data, prompt injection, etc.  
* Action taken: allowed, tokenized, redacted, blocked, or rejected.  
* Selected AI model.  
* Risk score.  
* Anonymized event ID.

This allows security teams to investigate misuse without creating another location where confidential content can leak. OWASP recommends logging requests and access with traceability while avoiding the logging of sensitive data.[cheatsheetseries.owasp](https://cheatsheetseries.owasp.org/cheatsheets/Secure_AI_Model_Ops_Cheat_Sheet.html)

## **6\. Incident Response and Alerts**

The interface should include an incident-response workflow. If the system detects repeated attempts to send credentials, bypass security controls, or inject prompts, it should alert the security administrator.

The response process can include:

* Immediate blocking of the suspicious request.  
* Alert to the user and administrator.  
* Temporary restriction of the account if needed.  
* Review of security logs.  
* Revocation of exposed API keys.  
* Reporting through the organization’s incident-response process.

## **7\. User Education and Security Warnings**

Many leaks happen because users do not understand what is risky to share. The interface should provide short, clear warnings and guidance.

Examples:

* “Do not paste passwords, API keys, or private keys.”  
* “Customer data should be sent only to approved private models.”  
* “Files and web content may contain hidden instructions. Review before processing.”  
* “This response contains sensitive information and has been redacted.”

This turns the product into not only a security tool but also a privacy-awareness tool.

## **8\. Offline or On-Device Processing Option**

For highly sensitive data, the system should offer an option to process data locally or within the organization’s private environment.

For example:

* Basic regex detection and redaction can happen in the browser.  
* OCR and speech-to-text can be processed locally where possible.  
* Highly confidential documents can be sent only to a private enterprise model.  
* Public models can be used only after the system confirms that no restricted data remains.

This reduces the amount of sensitive data that ever leaves the user’s device or company network.

## **9\. Secure File and PDF Handling**

Since your project includes PDF and document output, it needs secure file handling.

The system should:

* Scan uploaded files for malware.  
* Limit file types and file size.  
* Remove hidden metadata from exported PDFs.  
* Sanitize file names.  
* Avoid embedding active scripts or unsafe links.  
* Encrypt stored PDFs if the user chooses to save them.  
* Automatically delete temporary files after processing.

## **10\. Model and Supply-Chain Security**

Your interface will depend on external AI providers, APIs, libraries, and models. These dependencies create supply-chain risk.

The project should include:

* A list of approved AI providers and model versions.  
* Verification of API endpoints.  
* Dependency scanning for vulnerable libraries.  
* Regular updates and patching.  
* Vendor security review before adding a new AI provider.  
* Monitoring for unexpected model behavior or provider changes.

OWASP identifies supply-chain vulnerabilities and excessive agency as important LLM security risks, especially when systems depend on external models, tools, and platforms.documents.trendmicro+1

## **11\. Limited AI Agency**

The AI model should not be allowed to perform actions on its own unless the user explicitly approves them.

For the first version, the AI should only:

* Answer questions.  
* Summarize content.  
* Generate text.  
* Analyze uploaded content.  
* Create a document or PDF.

It should not automatically:

* Send emails.  
* Access cloud storage.  
* Delete files.  
* Make purchases.  
* Post to social media.  
* Access other connected applications.

This prevents “excessive agency,” where an AI system is given more autonomy or access than necessary.documents.trendmicro+1

## **12\. Feedback and Accuracy Improvement**

The interface should allow users to report detection mistakes.

For example:

* “This was incorrectly marked as sensitive.”  
* “This sensitive data was missed.”  
* “This prompt was incorrectly blocked as prompt injection.”

The feedback can help improve the ML models over time. However, feedback data must be anonymized and must not include the raw confidential prompt.

## **13\. Backup, Recovery, and Availability**

The platform should remain available even if one AI provider fails.

It should include:

* Health checks for each AI provider.  
* Automatic fallback to another approved model, if permitted.  
* Clear error messages when a provider is unavailable.  
* Secure backup of configuration and policy data.  
* Recovery procedures for system failure.

## **14\. Admin Dashboard**

An administrator dashboard will make the project more complete for organizational use.

It can show:

* Number of prompts processed.  
* Number of PII items detected.  
* Number of secrets blocked.  
* Number of prompt-injection attempts.  
* Most frequently used AI models.  
* Policy violations.  
* User feedback on false positives and false negatives.  
* Provider status and API usage.

## **15\. Privacy Policy and User Consent**

Before using the platform, users should see a simple privacy policy explaining:

* What data is processed.  
* How speech and images are converted to text.  
* Which AI providers may receive sanitized data.  
* What is stored and for how long.  
* How users can delete their data or disconnect accounts.  
* How security incidents are handled.

This is especially important if the platform is used by companies, students, or organizations handling personal data.

## **Most Important Additions for Your MVP**

For the first version, prioritize these features:

1. Human confirmation for high-risk prompts.  
2. Data-sensitivity labels.  
3. Rate limiting and abuse prevention.  
4. Minimal audit logging.  
5. Secure file and PDF handling.  
6. Limited AI agency.  
7. Admin dashboard.  
8. Privacy policy and user consent.

NIST’s Generative AI Risk Management Profile emphasizes evaluating and documenting AI-system security and resilience, which makes monitoring, testing, incident response, and governance important parts of your project rather than optional extras.

