(() => {
  const script = document.currentScript;
  if (!script || window.__xirevoa) return;
  window.__xirevoa = true;

  const key = script.getAttribute("data-key");
  if (!key) return;
  const api = new URL(script.src).origin;
  const accent = script.getAttribute("data-color") || "#111111";
  const label = script.getAttribute("data-label") || "Try it on";

  const CART_SELECTORS = [
    'form[action*="/cart/add"] [type="submit"]',
    'form[action*="/cart/add"] button[name="add"]',
    'button[name="add"]',
    ".single_add_to_cart_button",
    '[data-action="add-to-cart"]',
    'button[id*="add-to-cart" i]',
    'button[class*="add-to-cart" i]',
    'button[id*="addtocart" i]',
    'button[class*="addtocart" i]',
  ];

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const findCartButton = () => {
    for (const sel of CART_SELECTORS) {
      const el = [...document.querySelectorAll(sel)].find(visible);
      if (el) return el;
    }
    return [...document.querySelectorAll('button, input[type="submit"], a[role="button"]')].find(
      (el) => visible(el) && /add to (cart|bag|basket)/i.test(el.textContent || el.value || ""),
    );
  };

  const isProductPage = () => {
    const type = document.querySelector('meta[property="og:type"]');
    if (type && /product/i.test(type.content)) return true;
    if (/\/products?\//.test(location.pathname)) return true;
    if (document.body.classList.contains("single-product")) return true;
    return [...document.querySelectorAll('script[type="application/ld+json"]')].some((s) =>
      /"@type"\s*:\s*"Product"/.test(s.textContent || ""),
    );
  };

  const absolute = (src) => {
    try {
      const u = new URL(src, location.href);
      if (u.protocol === "http:") u.protocol = "https:";
      return u.href;
    } catch {
      return null;
    }
  };

  const findProductImage = (slot) => {
    const explicit = slot && slot.getAttribute("data-image");
    if (explicit) return absolute(explicit);
    const og = document.querySelector('meta[property="og:image:secure_url"], meta[property="og:image"]');
    if (og && og.content) return absolute(og.content);
    let best = null;
    let area = 0;
    for (const img of document.images) {
      const r = img.getBoundingClientRect();
      if (r.width * r.height > area && (img.currentSrc || img.src)) {
        area = r.width * r.height;
        best = img.currentSrc || img.src;
      }
    }
    return best && absolute(best);
  };

  const productName = () => {
    const og = document.querySelector('meta[property="og:title"]');
    const h1 = document.querySelector("h1");
    return ((og && og.content) || (h1 && h1.textContent) || document.title).trim().slice(0, 200);
  };

  const downscale = async (file) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (bitmap.close) bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const CSS = `
    :host { all: initial; display: block; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .open { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin: 10px 0 0; padding: 14px 18px; border: 1.5px solid ${accent}; border-radius: 6px; background: #fff; color: ${accent}; font-size: 15px; font-weight: 600; letter-spacing: .02em; cursor: pointer; transition: background .2s, color .2s; }
    .open:hover { background: ${accent}; color: #fff; }
    .open svg { width: 18px; height: 18px; }
    .backdrop { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.55); }
    .sheet { position: relative; width: 100%; max-width: 420px; max-height: calc(100dvh - 32px); overflow-y: auto; border-radius: 16px; background: #fff; color: #111; padding: 24px; box-shadow: 0 24px 64px rgba(0,0,0,.3); }
    @media (max-width: 520px) { .backdrop { align-items: flex-end; padding: 0; } .sheet { max-width: none; border-radius: 16px 16px 0 0; max-height: 92dvh; } }
    .close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #f2f2f2; color: #111; font-size: 18px; line-height: 1; cursor: pointer; }
    h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    p { margin: 0; font-size: 14px; line-height: 1.5; color: #555; }
    .product { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 10px; border-radius: 10px; background: #f6f6f6; }
    .product img { width: 48px; height: 60px; object-fit: cover; border-radius: 6px; background: #eee; }
    .product span { font-size: 13px; font-weight: 600; color: #222; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 180px; border: 1.5px dashed #bbb; border-radius: 12px; background: #fafafa; color: #333; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; padding: 16px; }
    .drop small { font-weight: 400; color: #777; }
    .photo, .result { display: block; width: 100%; border-radius: 12px; background: #f2f2f2; }
    .photo { max-height: 340px; object-fit: contain; }
    .btn { display: block; width: 100%; margin-top: 12px; padding: 14px; border: 0; border-radius: 8px; background: ${accent}; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
    .btn.ghost { background: #fff; color: #111; border: 1.5px solid #ddd; }
    .loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 0; text-align: center; }
    .spin { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #eee; border-top-color: ${accent}; animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: #fff1f1; color: #b42318; font-size: 13px; }
    .foot { margin-top: 16px; font-size: 11px; line-height: 1.5; color: #888; text-align: center; }
    .foot a { color: #888; }
    input[type=file] { display: none; }
  `;

  const ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>';

  const escape = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  let host = null;

  const mount = () => {
    if (host && host.isConnected) return;
    const slot = document.querySelector("[data-xirevoa-tryon]");
    const cart = findCartButton();
    if (!slot && !(cart && isProductPage())) return;
    const image = findProductImage(slot);
    if (!image) return;

    host = document.createElement("div");
    host.setAttribute("data-xirevoa", "");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style><button class="open" type="button">${ICON}${escape(label)}</button>`;
    root.querySelector(".open").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSheet(findProductImage(slot) || image);
    });

    if (slot) slot.appendChild(host);
    else cart.insertAdjacentElement("afterend", host);
  };

  const openSheet = (image) => {
    const name = productName();
    let photo = null;
    let tryonId = null;

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${escape(label)}"><button class="close" aria-label="Close">×</button><div class="body"></div><p class="foot">Your photo is only used to create this preview.<br>Powered by <a href="${api}" target="_blank" rel="noopener">Xirevoa</a></p></div>`;
    const body = backdrop.querySelector(".body");
    const previousOverflow = document.documentElement.style.overflow;

    const modal = document.createElement("div");
    modal.setAttribute("data-xirevoa-modal", "");
    const root = modal.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style>`;

    const close = () => {
      modal.remove();
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => e.key === "Escape" && close();

    backdrop.addEventListener("click", (e) => e.target === backdrop && close());
    backdrop.querySelector(".close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    const header = `<h2>See it on you</h2><p>Upload a clear photo of yourself and we'll show you wearing this.</p><div class="product"><img src="${escape(image)}" alt=""><span>${escape(name)}</span></div>`;

    const pick = () => {
      body.innerHTML = `${header}<label class="drop"><input type="file" accept="image/*">Upload your photo<small>Full or half body, facing the camera, good light</small></label>`;
      body.querySelector("input").addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          photo = await downscale(file);
          ready();
        } catch {
          pick();
          body.insertAdjacentHTML("beforeend", `<div class="error">We couldn't read that photo. Try a JPG or PNG.</div>`);
        }
      });
    };

    const ready = (error) => {
      body.innerHTML = `${header}<img class="photo" src="${photo}" alt="Your photo"><button class="btn go">${escape(label)}</button><button class="btn ghost change">Use a different photo</button>${error ? `<div class="error">${escape(error)}</div>` : ""}`;
      body.querySelector(".go").addEventListener("click", generate);
      body.querySelector(".change").addEventListener("click", pick);
    };

    const generate = async () => {
      body.innerHTML = `<div class="loading"><div class="spin"></div><h2>Creating your look</h2><p>This takes about 30 seconds.</p></div>`;
      try {
        const res = await fetch(`${api}/api/widget/tryon`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, person: photo, image, url: location.origin + location.pathname, name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) return ready(data.error || "Something went wrong. Please try again.");
        tryonId = data.id;
        result(data.url);
      } catch {
        ready("Couldn't reach the fitting room. Check your connection and try again.");
      }
    };

    const result = (url) => {
      body.innerHTML = `<h2>Here's you in it</h2><p>${escape(name)}</p><img class="result" style="margin-top:14px" src="${escape(url)}" alt="You wearing ${escape(name)}">${findCartButton() ? `<button class="btn cart">Add to cart</button>` : ""}<button class="btn ghost again">Try a different photo</button>`;
      const add = body.querySelector(".cart");
      if (add) {
        add.addEventListener("click", () => {
          const payload = JSON.stringify({ key, id: tryonId, type: "add_to_cart" });
          if (!(navigator.sendBeacon && navigator.sendBeacon(`${api}/api/widget/event`, payload))) {
            fetch(`${api}/api/widget/event`, { method: "POST", body: payload, keepalive: true }).catch(() => {});
          }
          close();
          const cart = findCartButton();
          if (cart) cart.click();
        });
      }
      body.querySelector(".again").addEventListener("click", pick);
    };

    document.documentElement.style.overflow = "hidden";
    root.appendChild(backdrop);
    document.body.appendChild(modal);
    pick();
  };

  let pending = 0;
  const watch = () => {
    clearTimeout(pending);
    pending = setTimeout(mount, 300);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
  new MutationObserver(watch).observe(document.documentElement, { childList: true, subtree: true });
})();
