import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

const canvas = document.querySelector("#avatar-canvas");
const loadingElement = document.querySelector("#avatar-loading");

let vrm = null;
let isSpeaking = false;
let lastTime = performance.now();

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  30,
  1,
  0.1,
  100,
);

camera.position.set(0, 1.35, 2.25);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xd7f3ff, 3.2);
keyLight.position.set(2.5, 4, 3);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x80c9ff, 1.5);
fillLight.position.set(-2, 2, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xb397ff, 2.2);
rimLight.position.set(-3, 3, -2);
scene.add(rimLight);

/**
 * แสดง Error บริเวณโหลดโมเดล
 */
function showLoadError(message) {
  if (!loadingElement) return;

  loadingElement.innerHTML = `
    <i class="bi bi-exclamation-triangle-fill text-warning fs-2"></i>
    <span>${message}</span>
  `;
}

/**
 * โหลดโมเดล VRM
 */
const loader = new GLTFLoader();

loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

loader.load(
  "./avatar/character.vrm",

  (gltf) => {
    vrm = gltf.userData.vrm;

    if (!vrm) {
      showLoadError("ไฟล์นี้ไม่ใช่โมเดล VRM ที่รองรับ");
      return;
    }

    // แก้ปัญหาโมเดล VRM 0.x หันผิดทิศ
    VRMUtils.rotateVRM0(vrm);

    /*
      ตำแหน่งโมเดล:
      x = ซ้าย/ขวา
      y = สูง/ต่ำ
      z = หน้า/หลัง
    */
    vrm.scene.position.set(0, -1.15, 0);

    /*
      ถ้าตัวละครหันหลัง ให้ลองเปิดบรรทัดนี้:
      vrm.scene.rotation.y = Math.PI;
    */

    scene.add(vrm.scene);

    loadingElement?.classList.add("hidden");

    if (window.setAvatarReady) {
      window.setAvatarReady();
    }
  },

  (progress) => {
    if (!loadingElement || !progress.total) return;

    const percent = Math.round((progress.loaded / progress.total) * 100);

    loadingElement.innerHTML = `
      <div class="spinner-border text-info" role="status"></div>
      <span>กำลังโหลดตัวละคร 3D... ${percent}%</span>
    `;
  },

  (error) => {
    console.error("VRM loading error:", error);
    showLoadError("โหลดโมเดล 3D ไม่สำเร็จ");
  },
);

/**
 * ให้ app.js เรียกเพื่อสั่ง Avatar พูด/หยุดพูด
 */
window.setAvatarSpeaking = (speaking) => {
  isSpeaking = speaking;
};

/**
 * ตั้งค่าการแสดงออกทางสีหน้า
 * ตัวอย่าง:
 * window.setAvatarExpression("happy", 1);
 */
window.setAvatarExpression = (expressionName, value = 1) => {
  if (!vrm?.expressionManager) return;

  vrm.expressionManager.setValue(expressionName, value);
};

/**
 * ปรับขนาด Canvas ตามพื้นที่แสดงผล
 */
function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  const pixelRatio = renderer.getPixelRatio();
  const expectedWidth = Math.floor(width * pixelRatio);
  const expectedHeight = Math.floor(height * pixelRatio);

  if (
    canvas.width !== expectedWidth ||
    canvas.height !== expectedHeight
  ) {
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

/**
 * กระพริบตา
 */
function updateBlink(elapsedTime) {
  if (!vrm?.expressionManager) return;

  const wave = Math.sin(elapsedTime * 1.8);

  const blink = wave > 0.975
    ? Math.min((wave - 0.975) * 40, 1)
    : 0;

  vrm.expressionManager.setValue("blink", blink);
}

/**
 * ขยับปากระหว่างระบบ TTS พูด
 * โมเดลควรมี expression: aa, ih, ou, ee, oh
 */
function updateMouth(elapsedTime) {
  if (!vrm?.expressionManager) return;

  if (!isSpeaking) {
    vrm.expressionManager.setValue("aa", 0);
    vrm.expressionManager.setValue("ih", 0);
    vrm.expressionManager.setValue("ou", 0);
    vrm.expressionManager.setValue("ee", 0);
    vrm.expressionManager.setValue("oh", 0);
    return;
  }

  const aa = 0.25 + (Math.sin(elapsedTime * 15) + 1) * 0.27;
  const oh = Math.max(0, Math.sin(elapsedTime * 8)) * 0.22;
  const ih = Math.max(0, Math.sin(elapsedTime * 11)) * 0.18;

  vrm.expressionManager.setValue("aa", aa);
  vrm.expressionManager.setValue("oh", oh);
  vrm.expressionManager.setValue("ih", ih);
  vrm.expressionManager.setValue("ou", 0);
  vrm.expressionManager.setValue("ee", 0);
}

/**
 * ขยับหัวเบา ๆ ให้ดูเป็นธรรมชาติ
 */
function updateHeadMovement(elapsedTime) {
  const head = vrm?.humanoid?.getNormalizedBoneNode("head");

  if (!head) return;

  head.rotation.y = Math.sin(elapsedTime * 0.65) * 0.09;
  head.rotation.x = Math.sin(elapsedTime * 1.1) * 0.025;

  if (isSpeaking) {
    head.rotation.x += Math.sin(elapsedTime * 4) * 0.02;
  }
}

/**
 * Render loop
 */
function animate(currentTime) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;
  const elapsedTime = currentTime / 1000;

  lastTime = currentTime;

  resizeRenderer();

  if (vrm) {
    vrm.update(deltaTime);
    updateBlink(elapsedTime);
    updateMouth(elapsedTime);
    updateHeadMovement(elapsedTime);
  }

  renderer.render(scene, camera);
}

animate(performance.now());

/**
 * คืนทรัพยากร GPU เมื่อผู้ใช้ออกจากหน้า
 */
window.addEventListener("beforeunload", () => {
  renderer.dispose();
});
