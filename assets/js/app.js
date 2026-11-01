
/* ==========================================
   COLORLAB - INTERACTIVE COLOR STUDIO
   Main JavaScript
========================================== */


/* ==========================================
   1. ELEMENTOS DO DOM
========================================== */

const colorPicker = document.getElementById("color-picker");
const hexInput = document.getElementById("hex-input");

const colorPreview = document.getElementById("color-preview");
const previewHex = document.getElementById("preview-hex");
const currentColorName = document.getElementById("current-color-name");

const hexValue = document.getElementById("hex-value");
const rgbValue = document.getElementById("rgb-value");
const hslValue = document.getElementById("hsl-value");

const randomButton = document.getElementById("random-btn");
const finalRandomButton = document.getElementById("final-random");

const favoriteButton = document.getElementById("favorite-btn");
const favoriteIcon = document.getElementById("favorite-icon");

const historyList = document.getElementById("history-list");
const favoritesList = document.getElementById("favorites-list");

const historyCount = document.getElementById("history-count");
const favoritesCount = document.getElementById("favorites-count");

const toast = document.getElementById("toast");


/* ==========================================
   2. ESTADO DA APLICAÇÃO
========================================== */

// Cor atualmente selecionada.

let currentColor = "#8B5CF6";

// Histórico de cores e favoritos.
// Os dados são recuperados do LocalStorage.

function loadStorage(key) {

    try {

        const data = JSON.parse(localStorage.getItem(key) || "[]");

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.warn(`Não foi possível ler ${key}:`, error);

        return [];

    }

}

let colorHistory = loadStorage("colorlab-history");
let favoriteColors = loadStorage("colorlab-favorites");

// Limita o tamanho das coleções e valida os valores recuperados.

const MAX_HISTORY = 12;
const MAX_FAVORITES = 30;

function normalizeCollection(collection, limit) {

    return [...new Set(
        collection.filter(color => isValidHex(color))
            .map(color => color.toUpperCase())
    )].slice(0, limit);

}

colorHistory = normalizeCollection(colorHistory, MAX_HISTORY);
favoriteColors = normalizeCollection(favoriteColors, MAX_FAVORITES);


/* ==========================================
   3. FUNÇÕES AUXILIARES
========================================== */

// Valida códigos HEX com 3 ou 6 caracteres.

function isValidHex(value) {

    return typeof value === "string" &&
        /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value.trim());

}


// Normaliza o código HEX.

function normalizeHex(hex) {

    let value = hex.trim().replace("#", "");

    if (value.length === 3) {

        value = value.split("")
            .map(character => character + character)
            .join("");

    }

    return `#${value.toUpperCase()}`;

}


// Converte HEX para RGB.

function hexToRgb(hex) {

    const normalized = normalizeHex(hex);

    const value = normalized.substring(1);

    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16)
    };

}


// Converte RGB para HSL.

function rgbToHsl(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h;
    let s;

    const l = (max + min) / 2;

    if (max === min) {

        h = 0;
        s = 0;

    } else {

        const delta = max - min;

        s = l > 0.5
            ? delta / (2 - max - min)
            : delta / (max + min);

        switch (max) {

            case r:
                h = (g - b) / delta + (g < b ? 6 : 0);
                break;

            case g:
                h = (b - r) / delta + 2;
                break;

            case b:
                h = (r - g) / delta + 4;
                break;

        }

        h /= 6;

    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };

}


// Converte uma cor HEX em todos os formatos.

function getColorFormats(hex) {

    const rgb = hexToRgb(hex);

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
        hex: normalizeHex(hex),
        rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
        hsl: `${hsl.h}, ${hsl.s}%, ${hsl.l}%`
    };

}


// Formata os dados para o LocalStorage.

function saveStorage() {

    try {

        localStorage.setItem(
            "colorlab-history",
            JSON.stringify(colorHistory)
        );

        localStorage.setItem(
            "colorlab-favorites",
            JSON.stringify(favoriteColors)
        );

    } catch (error) {

        console.error("Erro ao salvar no LocalStorage:", error);

        showToast("Não foi possível salvar os dados.");

    }

}


/* ==========================================
   4. NOTIFICAÇÕES
========================================== */

let toastTimeout;

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);

}


/* ==========================================
   5. HISTÓRICO DE CORES
========================================== */

function addToHistory(color) {

    const normalized = normalizeHex(color);

    // Evita duplicar a última cor selecionada.

    colorHistory = colorHistory.filter(
        item => item !== normalized
    );

    // Adiciona a cor mais recente no início.

    colorHistory.unshift(normalized);

    // Mantém somente as últimas 12 cores.

    colorHistory = colorHistory.slice(0, MAX_HISTORY);

    saveStorage();

    renderCollections();

}


/* ==========================================
   6. ATUALIZAÇÃO DA INTERFACE
========================================== */

function updateColor(hex, addHistory = true) {

    if (!isValidHex(hex)) {

        return false;

    }

    currentColor = normalizeHex(hex);

    const formats = getColorFormats(currentColor);

    // Atualiza os controles.

    colorPicker.value = currentColor;
    hexInput.value = currentColor;

    // Atualiza a visualização.

    colorPreview.style.background = currentColor;

    previewHex.textContent = currentColor;

    currentColorName.textContent = currentColor;

    // Atualiza os formatos.

    hexValue.textContent = formats.hex;
    rgbValue.textContent = formats.rgb;
    hslValue.textContent = formats.hsl;

    // Atualiza o estado dos favoritos.

    updateFavoriteButton();

    // Registra a cor no histórico.

    if (addHistory) {

        addToHistory(currentColor);

    }

    return true;

}


/* ==========================================
   7. SELETOR DE CORES
========================================== */

// Atualiza a cor quando o seletor visual é utilizado.

colorPicker.addEventListener("input", (event) => {

    updateColor(event.target.value);

});


// Permite inserir códigos HEX manualmente.

function handleHexInput() {

    const value = hexInput.value.trim();

    if (isValidHex(value)) {

        updateColor(value);

    }

}


// Atualiza ao pressionar Enter.

hexInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        handleHexInput();

        hexInput.blur();

    }

});


// Atualiza ao sair do campo.

hexInput.addEventListener("change", handleHexInput);


// Restaura o valor anterior se o código for inválido.

hexInput.addEventListener("blur", () => {

    if (!isValidHex(hexInput.value)) {

        hexInput.value = currentColor;

        showToast("Código HEX inválido.");

    }

});


/* ==========================================
   8. GERADOR ALEATÓRIO
========================================== */

function generateRandomColor() {

    const characters = "0123456789ABCDEF";

    let color = "#";

    for (let i = 0; i < 6; i++) {

        const randomIndex = Math.floor(
            Math.random() * characters.length
        );

        color += characters[randomIndex];

    }

    updateColor(color);

    showToast("New color generated!");

}


randomButton.addEventListener("click", generateRandomColor);

finalRandomButton.addEventListener("click", generateRandomColor);


/* ==========================================
   9. COPIAR CÓDIGOS
========================================== */

async function copyToClipboard(text) {

    try {

        if (navigator.clipboard && window.isSecureContext) {

            await navigator.clipboard.writeText(text);

        } else {

            // Fallback para contextos sem Clipboard API.

            const temporaryInput = document.createElement("textarea");

            temporaryInput.value = text;

            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";

            document.body.appendChild(temporaryInput);

            temporaryInput.select();

            const copied = document.execCommand("copy");

            temporaryInput.remove();

            if (!copied) {

                throw new Error("Copy command failed.");

            }

        }

        showToast("Copied to clipboard!");

    } catch (error) {

        console.error("Copy error:", error);

        showToast("Could not copy the code.");

    }

}


// Copia HEX, RGB ou HSL.

document.querySelectorAll("[data-copy]").forEach(button => {

    button.addEventListener("click", () => {

        const format = button.dataset.copy;

        const formats = getColorFormats(currentColor);

        let value;

        if (format === "hex") {

            value = formats.hex;

        } else if (format === "rgb") {

            value = `rgb(${formats.rgb})`;

        } else if (format === "hsl") {

            value = `hsl(${formats.hsl})`;

        }

        copyToClipboard(value);

    });

});


/* ==========================================
   10. PALETAS PREDEFINIDAS
========================================== */

const predefinedPalettes = [

    {
        name: "Sunset",
        colors: [
            "#F97316",
            "#FB7185",
            "#E879F9",
            "#A855F7",
            "#6366F1"
        ]
    },

    {
        name: "Ocean",
        colors: [
            "#082F49",
            "#0369A1",
            "#0EA5E9",
            "#38BDF8",
            "#BAE6FD"
        ]
    },

    {
        name: "Forest",
        colors: [
            "#14532D",
            "#166534",
            "#16A34A",
            "#86EFAC",
            "#DCFCE7"
        ]
    },

    {
        name: "Pastel Dreams",
        colors: [
            "#FBCFE8",
            "#DDD6FE",
            "#BFDBFE",
            "#A7F3D0",
            "#FEF3C7"
        ]
    },

    {
        name: "Monochrome",
        colors: [
            "#171717",
            "#404040",
            "#737373",
            "#A3A3A3",
            "#E5E5E5"
        ]
    },

    {
        name: "Cyberpunk",
        colors: [
            "#701A75",
            "#C026D3",
            "#E879F9",
            "#22D3EE",
            "#67E8F9"
        ]
    }

];


// Renderiza todas as paletas.

function renderPalettes() {

    const paletteGrid = document.getElementById("palette-grid");

    paletteGrid.innerHTML = "";

    predefinedPalettes.forEach(palette => {

        const card = document.createElement("article");

        card.className = "palette-card";

        const title = document.createElement("h3");

        title.textContent = palette.name;

        const colorsContainer = document.createElement("div");

        colorsContainer.className = "palette-colors";

        palette.colors.forEach(color => {

            const colorButton = document.createElement("button");

            colorButton.className = "palette-color";

            colorButton.style.backgroundColor = color;

            colorButton.title = `Apply ${color}`;

            colorButton.setAttribute(
                "aria-label",
                `Selecionar cor ${color}`
            );

            colorButton.addEventListener("click", () => {

                updateColor(color);

                showToast(`${color} selected!`);

            });

            colorsContainer.appendChild(colorButton);

        });

        card.appendChild(title);
        card.appendChild(colorsContainer);

        paletteGrid.appendChild(card);

    });

}


/* ==========================================
   11. FAVORITOS
========================================== */

function updateFavoriteButton() {

    const isFavorite = favoriteColors.includes(currentColor);

    favoriteButton.classList.toggle("active", isFavorite);

    favoriteIcon.textContent = isFavorite ? "♥" : "♡";

    favoriteButton.setAttribute(
        "aria-label",
        isFavorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
    );

}


// Adiciona ou remove uma cor dos favoritos.

favoriteButton.addEventListener("click", () => {

    const isFavorite = favoriteColors.includes(currentColor);

    if (isFavorite) {

        favoriteColors = favoriteColors.filter(
            color => color !== currentColor
        );

        showToast("Removed from favorites.");

    } else {

        if (favoriteColors.length >= MAX_FAVORITES) {

            showToast("Maximum of 30 favorites reached.");

            return;

        }

        favoriteColors.unshift(currentColor);

        showToast("Added to favorites!");

    }

    saveStorage();

    updateFavoriteButton();

    renderCollections();

});


/* ==========================================
   12. RENDERIZAÇÃO DO HISTÓRICO
========================================== */

function renderCollection(container, colors, type) {

    container.innerHTML = "";

    if (colors.length === 0) {

        const message = document.createElement("p");

        message.className = "empty-message";

        message.textContent = type === "history"
            ? "Your color history will appear here."
            : "Your favorite colors will appear here.";

        container.appendChild(message);

        return;

    }

    colors.forEach(color => {

        const item = document.createElement("div");

        item.className = "collection-color";

        item.style.backgroundColor = color;

        item.title = color;

        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        item.setAttribute("aria-label", `Selecionar ${color}`);

        // Seleciona a cor ao clicar.

        function selectColor() {

            updateColor(color);

            showToast(`${color} selected!`);

        }

        item.addEventListener("click", selectColor);

        item.addEventListener("keydown", event => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();

                selectColor();

            }

        });

        // Botão para remover uma cor.

        const removeButton = document.createElement("button");

        removeButton.className = "remove-color";

        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Remover ${color}`
        );

        removeButton.addEventListener("click", event => {

            event.stopPropagation();

            if (type === "history") {

                colorHistory = colorHistory.filter(
                    item => item !== color
                );

            } else {

                favoriteColors = favoriteColors.filter(
                    item => item !== color
                );

            }

            saveStorage();

            renderCollections();

            updateFavoriteButton();

            showToast("Color removed.");

        });

        item.appendChild(removeButton);

        container.appendChild(item);

    });

}


// Atualiza histórico e favoritos.

function renderCollections() {

    renderCollection(historyList, colorHistory, "history");

    renderCollection(favoritesList, favoriteColors, "favorites");

    historyCount.textContent =
        `${colorHistory.length} colors`;

    favoritesCount.textContent =
        `${favoriteColors.length} colors`;

    updateFavoriteButton();

}


/* ==========================================
   13. GERADOR DE GRADIENTES
========================================== */

const gradientColorOne = document.getElementById("gradient-color-one");

const gradientColorTwo = document.getElementById("gradient-color-two");

const gradientDirection = document.getElementById("gradient-direction");

const gradientPreview = document.getElementById("gradient-preview");

const gradientCode = document.getElementById("gradient-code");

const copyGradientButton = document.getElementById("copy-gradient");


// Cria a string CSS do gradiente.

function generateGradient() {

    const firstColor = gradientColorOne.value.toUpperCase();

    const secondColor = gradientColorTwo.value.toUpperCase();

    const direction = gradientDirection.value;

    const gradient = `linear-gradient(${direction}, ${firstColor}, ${secondColor})`;

    // Atualiza a visualização.

    gradientPreview.style.background = gradient;

    // Atualiza o código CSS.

    gradientCode.textContent = gradient;

    return gradient;

}


// Eventos dos controles.

gradientColorOne.addEventListener("input", generateGradient);

gradientColorTwo.addEventListener("input", generateGradient);

gradientDirection.addEventListener("change", generateGradient);


// Copia o gradiente.

copyGradientButton.addEventListener("click", () => {

    copyToClipboard(`background: ${generateGradient()};`);

});


/* ==========================================
   14. INICIALIZAÇÃO
========================================== */

// Renderiza as paletas.

renderPalettes();

// Renderiza o histórico e os favoritos.

renderCollections();

// Inicializa a cor principal.

updateColor(currentColor);

// Inicializa o gerador de gradientes.

generateGradient();

// Atualiza o ano do rodapé.

document.getElementById("year").textContent =
    new Date().getFullYear();


// Salva as coleções normalizadas na primeira execução.

saveStorage();

console.log("ColorLab initialized successfully!");
