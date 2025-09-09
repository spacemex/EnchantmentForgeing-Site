const REQUIREMENT_TYPES = ["has_exp_levels", "has_exp_points", "has_enchantment"];
const MESSAGE_TYPES = ["CHAT", "ACTION"];
const NAMESPACE = "enchantmentforge";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function parseLevels(s) {
    if (!s) return [];
    return s.split(/[,\s]+/).map(v => parseInt(v)).filter(v => !isNaN(v));
}
function parseCosts(s) {
    const out = {};
    if (!s) return out;
    s.split(/[,\s]+/).forEach(pair => {
        const [lvl, cost] = pair.split(":");
        if (!lvl || !cost) return;
        const lvln = parseInt(lvl);
        const costn = parseInt(cost);
        if (!isNaN(lvln) && !isNaN(costn)) out[String(lvln)] = costn;
    });
    return out;
}
function csvList(s) {
    if (!s) return [];
    return s.split(",").map(v => v.trim()).filter(Boolean);
}

function addRequirement(reqContainer) {
    const div = document.createElement("div");
    div.className = "requirement-entry";
    div.innerHTML = `
    <div class="req-header">
      <strong>Requirement</strong>
      <button type="button" class="rmReq">Remove</button>
    </div>

    <label>Applies at Level:
      <input type="number" class="reqLevel" min="1" />
    </label>

    <label>Type:
      <select class="reqType">
        ${REQUIREMENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
      </select>
    </label>

    <div class="reqExtra"></div>

    <h6>Fail Action</h6>
    <label>Message: <input type="text" class="failMsg" /></label>
    <label>Message Type:
      <select class="failMsgType">
        ${MESSAGE_TYPES.map(m => `<option value="${m}">${m}</option>`).join("")}
      </select>
    </label>
    <label>Commands (comma separated): <input type="text" class="failCmds" /></label>
    <label>Sound ID: <input type="text" class="failSoundId" placeholder="minecraft:entity.villager.no" /></label>
    <label>Sound Volume: <input type="number" class="failSoundVol" value="1" step="0.1" /></label>
    <label>Sound Pitch: <input type="number" class="failSoundPitch" value="1" step="0.1" /></label>

    <h6>Success Action</h6>
    <label>Message: <input type="text" class="succMsg" /></label>
    <label>Message Type:
      <select class="succMsgType">
        ${MESSAGE_TYPES.map(m => `<option value="${m}">${m}</option>`).join("")}
      </select>
    </label>
    <label>Commands (comma separated): <input type="text" class="succCmds" /></label>
    <label>Sound ID: <input type="text" class="succSoundId" placeholder="minecraft:entity.villager.yes" /></label>
    <label>Sound Volume: <input type="number" class="succSoundVol" value="1" step="0.1" /></label>
    <label>Sound Pitch: <input type="number" class="succSoundPitch" value="1" step="0.1" /></label>
  `;

    const extra = $(".reqExtra", div);
    const typeSelect = $(".reqType", div);

    const renderExtra = () => {
        const t = typeSelect.value;
        if (t === "has_exp_levels" || t === "has_exp_points") {
            extra.innerHTML = `<label>Level: <input type="number" class="extraLevel" min="0" /></label>`;
        } else if (t === "has_enchantment") {
            extra.innerHTML = `
        <label>Enchantment ID: <input type="text" class="extraEnchantId" placeholder="minecraft:sharpness" /></label>
        <label>Min Level: <input type="number" class="extraMinLevel" min="1" /></label>
      `;
        } else {
            extra.innerHTML = "";
        }
    };
    typeSelect.addEventListener("change", () => { renderExtra(); buildAllRecipes(); });
    renderExtra();

    $(".rmReq", div).addEventListener("click", () => {
        div.remove();
        buildAllRecipes();
    });

    div.addEventListener("input", buildAllRecipes);

    reqContainer.appendChild(div);
}

function addGem(gemsContainer) {
    const div = document.createElement("div");
    div.className = "gem-entry";
    div.innerHTML = `
    <div class="gem-header">
      <strong>Gem</strong>
      <button type="button" class="rmGem">Remove</button>
    </div>

<label>Gem Type:
  <select class="gemType">
    <option value="item">Item</option>
    <option value="tag">Tag</option>
  </select>
</label>
<label>Gem ID:
  <input type="text" class="gemId" placeholder="minecraft:quartz or minecraft:gems" />
</label>
    <label>Enchantment: <input type="text" class="enchantId" placeholder="minecraft:sharpness" /></label>
    <label>Levels: <input type="text" class="levels" placeholder="1,2,3" /></label>
    <label>Costs per Level: <input type="text" class="costs" placeholder="1:10 2:20 3:30" /></label>

    <div class="requirements-wrap">
      <div class="requirements-container"></div>
      <button type="button" class="addReqBtn">+ Add Requirement</button>
    </div>
    <hr />
  `;

    $(".rmGem", div).addEventListener("click", () => {
        div.remove();
        buildAllRecipes();
    });

    $(".addReqBtn", div).addEventListener("click", () => {
        addRequirement($(".requirements-container", div));
        buildAllRecipes();
    });

    div.addEventListener("input", buildAllRecipes);

    gemsContainer.appendChild(div);
}

function addRecipe() {
    const wrapper = $("#recipes");

    if (wrapper.classList.contains("empty-state")) {
        wrapper.classList.remove("empty-state");
        wrapper.innerHTML = "";
    }

    const div = document.createElement("div");
    div.className = "recipe-entry";

    const idx = $$(".recipe-entry").length + 1;

    div.innerHTML = `
    <div class="recipe-header">
      <button type="button" class="toggle-btn">⬇️</button>
      <span>Recipe ${idx}</span>
      <button type="button" class="rmRecipe">Delete</button>
    </div>

    <div class="recipe-body">
      <label>Recipe Name:
        <input type="text" class="recipeId" placeholder="my_recipe" required />
      </label>

      <label>Fuel:
        <select class="fuelType">
          <option value="item">Item</option>
          <option value="tag">Tag</option>
        </select>
        <input type="text" class="fuel" placeholder="minecraft:emerald_block" />
      </label>

      <label>Tool:
        <select class="toolType">
          <option value="item">Item</option>
          <option value="tag">Tag</option>
        </select>
        <input type="text" class="tool" placeholder="minecraft:swords" />
      </label>

      <h4>Gem → Enchantment Mapping</h4>
      <div class="gems"></div>
      <button type="button" class="addGemBtn">+ Add Gem</button>
      <hr />
    </div>
  `;

    const body = $(".recipe-body", div);

    $(".toggle-btn", div).addEventListener("click", () => {
        body.classList.toggle("collapsed");
        const btn = $(".toggle-btn", div);
        btn.textContent = body.classList.contains("collapsed") ? "➡️" : "⬇️";
    });

    $(".rmRecipe", div).addEventListener("click", () => {
        div.remove();
        buildAllRecipes();

        if ($$(".recipe-entry").length === 0) {
            wrapper.classList.add("empty-state");
            wrapper.innerHTML = `<p>No recipes yet. Click <strong>+ Add Recipe</strong> to get started!</p>`;
        }
    });

    $(".addGemBtn", div).addEventListener("click", () => {
        addGem($(".gems", div));
        buildAllRecipes();
    });

    div.addEventListener("input", buildAllRecipes);

    wrapper.appendChild(div);
    addGem($(".gems", div));

    buildAllRecipes();
}

function buildAllRecipes() {
    const recipeEntries = $$(".recipe-entry");
    const all = [];

    recipeEntries.forEach(entry => {
        const id = $(".recipeId", entry)?.value.trim();
        const fuelVal = $(".fuel", entry)?.value.trim();
        const fuelType = $(".fuelType", entry)?.value;
        const toolVal = $(".tool", entry)?.value.trim();
        const toolType = $(".toolType", entry)?.value;

        const gemsObj = {};
        $$(".gem-entry", entry).forEach(gem => {
            const gemVal = $(".gemId", gem)?.value.trim();
            const gemType = $(".gemType", gem)?.value;
            if (!gemVal) return;

            const gemKey = gemType === "tag" ? `#${gemVal}` : gemVal;

            const enchantId = $(".enchantId", gem)?.value.trim();
            const levels = parseLevels($(".levels", gem)?.value);
            const costs = parseCosts($(".costs", gem)?.value);

            const gemJson = {
                enchantment: enchantId || "",
                level_map: levels,
                cost_modifier_per_level: costs
            };

            const reqBlocks = [];
            $$(".requirement-entry", gem).forEach(req => {
                const lvlStr = $(".reqLevel", req)?.value;
                if (!lvlStr) return;
                const lvl = String(parseInt(lvlStr));
                if (isNaN(parseInt(lvl))) return;

                const type = $(".reqType", req).value;
                const reqObj = { type };

                if (type === "has_exp_levels" || type === "has_exp_points") {
                    const n = parseInt($(".extraLevel", req)?.value);
                    if (!isNaN(n)) reqObj.level = n;
                } else if (type === "has_enchantment") {
                    reqObj.enchantment = $(".extraEnchantId", req)?.value || "";
                    const mn = parseInt($(".extraMinLevel", req)?.value);
                    if (!isNaN(mn)) reqObj.min_level = mn;
                }

                reqObj.fail = {
                    message: $(".failMsg", req)?.value || "",
                    "message-type": $(".failMsgType", req)?.value || "CHAT",
                    commands: csvList($(".failCmds", req)?.value),
                    sound: {
                        type: $(".failSoundId", req)?.value || "",
                        volume: parseFloat($(".failSoundVol", req)?.value || "1"),
                        pitch: parseFloat($(".failSoundPitch", req)?.value || "1")
                    }
                };

                reqObj.success = {
                    message: $(".succMsg", req)?.value || "",
                    "message-type": $(".succMsgType", req)?.value || "CHAT",
                    commands: csvList($(".succCmds", req)?.value),
                    sound: {
                        type: $(".succSoundId", req)?.value || "",
                        volume: parseFloat($(".succSoundVol", req)?.value || "1"),
                        pitch: parseFloat($(".succSoundPitch", req)?.value || "1")
                    }
                };

                reqBlocks.push({ [lvl]: reqObj });
            });

            if (reqBlocks.length) gemJson.requirements = reqBlocks;
            gemsObj[gemKey] = gemJson;
        });

        if (id) {
            const recipeJson = {
                type: "enchantmentforge:forge",
                fuel: fuelVal ? { [fuelType]: fuelVal } : {},
                tool: toolVal ? { [toolType]: toolVal } : {},
                gems_to_enchantment: gemsObj
            };
            all.push({ id, json: recipeJson });
        }
    });

    if (all.length) {
        $("#preview").innerHTML = all
            .map(r => syntaxHighlight(JSON.stringify(r.json, null, 2)))
            .join("\n\n");
    } else {
        $("#preview").innerHTML = "{}";
    }

    return all;
}

function downloadDatapack() {
    const all = buildAllRecipes();
    if (!all.length) {
        alert("No valid recipes. Please add at least one recipe with a Recipe ID.");
        return;
    }

    const zip = new JSZip();
    zip.file("pack.mcmeta", JSON.stringify({
        pack: { pack_format: 15, description: "Generated Enchantment Forge Recipes" }
    }, null, 2));

    all.forEach(r => {
        zip.file(`data/${NAMESPACE}/recipes/${r.id}.json`, JSON.stringify(r.json, null, 2));
    });

    zip.generateAsync({ type: "blob" }).then(content => {
        saveAs(content, "enchantmentforge_datapack.zip");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    addRecipe();
    $("#addRecipeBtn").addEventListener("click", addRecipe);
    $("#downloadBtn").addEventListener("click", downloadDatapack);
    $("#recipes").addEventListener("input", buildAllRecipes);
});
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.classList.add(savedTheme);
    updateThemeButton(savedTheme);

    $("#themeToggle").addEventListener("click", () => {
        const isDark = document.body.classList.contains("dark");
        document.body.classList.toggle("dark", !isDark);
        const newTheme = isDark ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        updateThemeButton(newTheme);
    });
});

function updateThemeButton(theme) {
    const btn = $("#themeToggle");
    btn.textContent = theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode";
}
function syntaxHighlight(json) {
    if (typeof json !== "string") {
        json = JSON.stringify(json, null, 2);
    }
    json = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    return json.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?)/g,
        match => {
            let cls = "";

            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = "json-key";
                } else {
                    const value = match.replace(/^"|"$/g, "");
                    if (value.startsWith("#")) {
                        cls = "json-tag";
                    } else if (value.startsWith("minecraft:")) {
                        cls = "json-item";
                    } else {
                        cls = "json-string";
                    }
                }
            } else if (/true|false/.test(match)) {
                cls = "json-boolean";
            } else if (/null/.test(match)) {
                cls = "json-null";
            } else {
                cls = "json-number";
            }

            return `<span class="${cls}">${match}</span>`;
        }
    );
}

