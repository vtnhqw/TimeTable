import { createCanvas, Image as NativeImage } from "@napi-rs/canvas";
export function installCanvasEnvironment() {
  globalThis.window = {};
  globalThis.document = { createElement: () => createCanvas(1, 1) };
  globalThis.Image = class extends NativeImage {
    set src(value) {
      if (typeof value === "string" && value.startsWith("blob:")) {
        fetch(value)
          .then((r) => r.arrayBuffer())
          .then((b) => {
            super.src = Buffer.from(b);
          })
          .catch((e) => this.onerror?.(e));
      } else super.src = value;
    }
  };
}
