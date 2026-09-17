const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxo-NAlOjKj5VjQJJ55w7ZN198wDOxjHHDJy3l8V0ktETXRUxy2-H_0NXx4UCxfHxNgrQ/exec";

const form = document.querySelector("#chat-form");
const messageInput = document.querySelector("#message");
const answerElement = document.querySelector("#answer");
const errorElement = document.querySelector("#error-message");
const sendButton = document.querySelector("#send-button");
const speakButton = document.querySelector("#speak-button");
const stopButton = document.querySelector("#stop-button");
const avatarStatus = document.querySelector("#avatar-status");

let currentText = answerElement.textContent.trim();
let requestCount = 0;

/**
 * เปลี่ยนสถานะ Avatar และสั่งโมเดล 3D ขยับปาก
 */
function setSpeaking(isSpeaking) {
  window.setAvatarSpeaking?.(isSpeaking);

  avatarStatus.textContent = isSpeaking
    ? "NOVA กำลังพูด..."
    : "NOVA พร้อมสนทนา";
}

/**
 * หยุดเสียงพูด
 */
function stopSpeaking() {
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

/**
 * เลือกเสียงภาษาไทยจาก Browser ถ้ามี
 */
function getThaiVoice() {
  const voices = window.speechSynthesis.getVoices();

  return voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("th"),
  );
}

/**
 * ให้ Avatar พูดคำตอบ
 */
function speak(text) {
  if (!text) return;

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "th-TH";
  utterance.rate = 1;
  utterance.pitch = 1.03;
  utterance.volume = 1;

  const thaiVoice = getThaiVoice();

  if (thaiVoice) {
    utterance.voice = thaiVoice;
  }

  utterance.onstart = () => {
    setSpeaking(true);
  };

  utterance.onend = () => {
    setSpeaking(false);
  };

  utterance.onerror = () => {
    setSpeaking(false);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * เรียก Google Apps Script ผ่าน JSONP
 * หลีกเลี่ยงปัญหา CORS ระหว่าง GitHub Pages และ Google Apps Script
 */
function callGoogleWebApp(message) {
  return new Promise((resolve, reject) => {
    if (!WEB_APP_URL || WEB_APP_URL.includes("https://script.google.com/macros/s/AKfycbxo-NAlOjKj5VjQJJ55w7ZN198wDOxjHHDJy3l8V0ktETXRUxy2-H_0NXx4UCxfHxNgrQ/exec")) {
      reject(new Error("กรุณาตั้งค่า WEB_APP_URL ในไฟล์ app.js"));
      return;
    }

    requestCount += 1;

    const callbackName = `aiAvatarCallback_${Date.now()}_${requestCount}`;
    const script = document.createElement("script");

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่"));
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeout);

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      delete window[callbackName];
    }

    window[callbackName] = (data) => {
      cleanup();

      if (!data || !data.ok) {
        reject(new Error(data?.error || "AI ไม่สามารถตอบกลับได้"));
        return;
      }

      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("ไม่สามารถเชื่อมต่อ Google Web App ได้"));
    };

    const query = new URLSearchParams({
      action: "chat",
      message,
      callback: callbackName,
    });

    script.src = `${WEB_APP_URL}?${query.toString()}`;

    document.body.appendChild(script);
  });
}

/**
 * ส่งข้อความให้ AI
 */
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) return;

  stopSpeaking();

  errorElement.textContent = "";
  sendButton.disabled = true;
  speakButton.disabled = true;
  messageInput.disabled = true;
  sendButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> กำลังคิด';
  avatarStatus.textContent = "NOVA กำลังคิด...";

  try {
    const data = await callGoogleWebApp(message);

    currentText = data.reply;
    answerElement.textContent = currentText;
    messageInput.value = "";

    speak(currentText);
  } catch (error) {
    const errorText =
      error instanceof Error
        ? error.message
        : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

    errorElement.textContent = errorText;
    avatarStatus.textContent = "NOVA พร้อมสนทนา";
  } finally {
    sendButton.disabled = false;
    speakButton.disabled = false;
    messageInput.disabled = false;
    sendButton.innerHTML = '<i class="bi bi-send-fill"></i><span class="d-none d-sm-inline ms-1">ส่ง</span>';
    messageInput.focus();
  }
});

speakButton.addEventListener("click", () => {
  speak(currentText);
});

stopButton.addEventListener("click", () => {
  stopSpeaking();
});

/**
 * Browser บางตัวจะโหลดรายการเสียงช้า
 */
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

/**
 * ฟังก์ชันนี้ถูกเรียกจาก app3d.js เมื่อโหลด VRM สำเร็จ
 */
window.setAvatarReady = () => {
  avatarStatus.textContent = "NOVA พร้อมสนทนา";
};
