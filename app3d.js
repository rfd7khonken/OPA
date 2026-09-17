const modelUrl = "./avatar/character.vrm";

loader.load(
  modelUrl,

  (gltf) => {
    vrm = gltf.userData.vrm;

    if (!vrm) {
      showLoadError("ไฟล์นี้ไม่ใช่ VRM ที่รองรับ");
      console.error("ไม่พบข้อมูล VRM ในไฟล์:", gltf);
      return;
    }

    VRMUtils.rotateVRM0(vrm);

    vrm.scene.position.set(0, -1.15, 0);

    scene.add(vrm.scene);

    loadingElement?.classList.add("hidden");

    window.setAvatarReady?.();
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
    console.error("โหลด VRM ไม่สำเร็จ");
    console.error("URL ที่เรียก:", modelUrl);
    console.error("รายละเอียด Error:", error);

    showLoadError(
      "โหลดโมเดล 3D ไม่สำเร็จ กรุณาตรวจไฟล์ avatar/character.vrm"
    );
  },
);
