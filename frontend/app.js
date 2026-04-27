// 🔴 CONFIGURE YOUR BACKEND API URL HERE
// For local development: http://localhost:3000
// For production: your deployed backend URL
const API = "http://localhost:3000"; // Change this to your backend URL

let currentPath = "";
let TOKEN = "";

/* =========================
   🔐 LOGIN
========================= */
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 200) {
    const data = await res.json();
    TOKEN = data.token;

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    load();
  } else {
    alert("Login failed");
  }
}

/* =========================
   📁 LOAD FILES
========================= */
async function load() {
  document.getElementById("path").innerText = "📂 /" + currentPath;

  const res = await fetch(`${API}/list?path=${currentPath}`, {
    headers: { Authorization: "Bearer " + TOKEN },
  });

  const data = await res.json();
  const list = document.getElementById("list");
  list.innerHTML = "";

  // Back button
  if (currentPath !== "") {
    const back = document.createElement("div");
    back.className = "item";
    back.innerHTML = "⬅️ <strong>Back to parent folder</strong>";
    back.onclick = () => {
      currentPath = currentPath.split("/").slice(0, -1).join("/");
      load();
    };
    list.appendChild(back);
  }

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";

    const name = document.createElement("span");
    name.innerText =
      item.type === "folder" ? "📁 " + item.name : "📄 " + item.name;

    name.onclick = () => {
      if (item.type === "folder") {
        currentPath =
          currentPath === "" ? item.name : currentPath + "/" + item.name;

        load();
      } else {
        const fileUrl = `${API}/files/${currentPath}/${item.name}`;

        // Image preview
        if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
          document.getElementById("preview").src = fileUrl;
          document.getElementById("preview").classList.remove("hidden");
          document.getElementById("videoPreview").classList.add("hidden");
        }

        // Video preview
        else if (item.name.match(/\.(mp4|webm|mov)$/i)) {
          const video = document.getElementById("videoPreview");
          video.src = fileUrl;
          video.classList.remove("hidden");
          document.getElementById("preview").classList.add("hidden");
        }
      }
    };

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️ Delete";
    delBtn.onclick = async (e) => {
      e.stopPropagation();

      const fullPath = currentPath ? currentPath + "/" + item.name : item.name;

      await fetch(`${API}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: TOKEN,
        },
        body: JSON.stringify({ path: fullPath }),
      });

      load();
    };

    div.appendChild(name);
    div.appendChild(delBtn);
    list.appendChild(div);
  });
}

/* =========================
   📁 CREATE FOLDER
========================= */
async function createFolder() {
  const name = document.getElementById("folderName").value;

  if (!name) {
    alert("Enter folder name");
    return;
  }

  const path = currentPath ? currentPath + "/" + name : name;

  await fetch(`${API}/create-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: TOKEN,
    },
    body: JSON.stringify({ path }),
  });

  document.getElementById("folderName").value = "";
  load();
}

/* =========================
   📤 UPLOAD WITH PROGRESS
========================= */
function upload() {
  const fileInput = document.getElementById("fileInput");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (!fileInput.files.length) {
    alert("Select files first");
    return;
  }

  if (currentPath === "") {
    alert("Enter a folder first");
    return;
  }

  const formData = new FormData();

  // 🔴 IMPORTANT: folder first
  formData.append("folder", currentPath);

  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append("images", fileInput.files[i]);
  }

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API}/upload`, true);

  // 🔐 AUTH HEADER
  xhr.setRequestHeader("Authorization", "Bearer " + TOKEN);

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.value = percent;
      progressText.innerText = percent + "%";
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      progressBar.value = 100;
      progressText.innerText = "Done";

      fileInput.value = "";
      load();
    } else {
      alert("Upload failed");
    }
  };

  xhr.send(formData);
}
