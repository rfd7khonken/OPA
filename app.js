const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz2c-H7FXSnTdR6E6Gd11uXyswKom8Pc_oKg8U5Lz75xe9mRACyA75FiZdkJGzmUN6tCw/exec";

const form = document.querySelector("#chat-form");
const messageInput = document.querySelector("#message");
const answerElement = document.querySelector("#answer");
const errorElement = document.querySelector("#error-message");
const sendButton = document.querySelector("#send-button");
const speakButton = document.querySelector("#speak-button");
const stopButton = document.querySelector("#stop-button");
const avatarFace = document.querySelector("#avatar-face");
const avatarStatus = document.querySelector("#avatar-status");

let currentText = answerElement.textContent;

function setSpeaking(isSpeaking) {
  avatarFace.classList.toggle("speaking", isSpeaking);
  avatarStatus.textContent = isSpeaking
    ? "Avatar กำลังพูด..."
    : "Avatar พร้อมสนทนา";
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

function speak(text) {
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 1;
  utterance.pitch = 1.03;

  const thaiVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("th"));

  if (thaiVoice) {
    utterance.voice = thaiVoice;
  }

  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => setSpeaking(false);
  utterance.onerror = () => setSpeaking(false);

  window.speechSynthesis.speak(utterance);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) return;

  stopSpeaking();
  errorElement.textContent = "";
  sendButton.disabled = true;
  sendButton.textContent = "กำลังคิด...";
  avatarStatus.textContent = "AI กำลังคิด...";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "ไม่สามารถติดต่อ AI ได้");
    }

    currentText = data.reply;
    answerElement.textContent = currentText;
    messageInput.value = "";

    speak(currentText);
  } catch (error) {
    errorElement.textContent =
      error instanceof Error
        ? error.message
        : "เกิดข้อผิดพลาด กรุณาลองใหม่";
    avatarStatus.textContent = "Avatar พร้อมสนทนา";
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "ส่ง";
  }
});

speakButton.addEventListener("click", () => speak(currentText));
stopButton.addEventListener("click", stopSpeaking);
window.speechSynthesis.onvoiceschanged = () => {};