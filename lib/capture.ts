/**
 * lib/capture.ts
 * Shared utility để chụp bill-preview thành ảnh JPEG.
 * Dùng html2canvas thay html-to-image vì iOS Safari support tốt hơn.
 *
 * Cách dùng:
 *   import { captureElement } from "@/lib/capture";
 *   await captureElement("bill-preview-content", "ten-file");
 */

/**
 * Preload một URL ảnh thành base64 data URL.
 * Cần thiết để html2canvas trên iOS đọc được ảnh (tránh lỗi CORS/tainted canvas).
 */
async function toBase64(url: string): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } catch {
                resolve(url); // fallback: dùng url gốc
            }
        };
        img.onerror = () => resolve(url);
        img.src = url + "?t=" + Date.now(); // cache bust
    });
}

/**
 * Thay thế tất cả <img> src trong một element bằng base64.
 * Trả về mảng các cleanup function để restore src cũ sau khi capture.
 */
async function inlineImages(el: HTMLElement): Promise<() => void> {
    const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
    const origSrcs: string[] = [];

    await Promise.all(
        imgs.map(async (img, i) => {
            origSrcs[i] = img.src;
            if (img.src && !img.src.startsWith("data:")) {
                const b64 = await toBase64(img.src);
                img.src = b64;
            }
        })
    );

    return () => {
        imgs.forEach((img, i) => {
            img.src = origSrcs[i];
        });
    };
}

export async function captureElement(
    elementId: string,
    fileName: string
): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) throw new Error("Element không tồn tại: " + elementId);

    // Dynamically import html2canvas (tránh SSR lỗi)
    const html2canvas = (await import("html2canvas-pro")).default;

    // 1. Clone element để không ảnh hưởng giao diện đang hiển thị
    const clone = el.cloneNode(true) as HTMLElement;

    // 2. Reset mọi transform/scale về 1, fix kích thước thực
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.marginBottom = "0";
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = "559px";
    clone.style.height = "794px";
    clone.style.overflow = "hidden";
    clone.style.zIndex = "-1";

    // 3. Tắt backdrop-filter trên mọi element con (iOS không support)
    const allChildren = clone.querySelectorAll("*") as NodeListOf<HTMLElement>;
    allChildren.forEach((child) => {
        child.style.backdropFilter = "none";
        child.style.setProperty("-webkit-backdrop-filter", "none");
    });

    // 4. Inject clone vào DOM
    document.body.appendChild(clone);

    // 5. Inline tất cả ảnh thành base64 trong clone
    const restoreImages = await inlineImages(clone);

    // 6. Đợi layout ổn định
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));

    try {
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: 559,
            height: 794,
            logging: false,
            // iOS: bỏ qua các pseudo-element không support
            ignoreElements: (element) => {
                return element.classList.contains("no-print");
            },
        });

        // 7. Export JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        const safeName = fileName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        link.download = `hop-dong-${safeName}.jpg`;
        link.href = dataUrl;
        link.click();
    } finally {
        // 8. Cleanup
        restoreImages();
        document.body.removeChild(clone);
    }
}