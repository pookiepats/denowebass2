import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import initWasm, { HTMLRewriter } from "https://deno.land/x/lol_html@0.0.4/mod.js";
import wasm from "https://deno.land/x/lol_html@0.0.4/wasm.js";

await initWasm(wasm());

const handler = async (req: Request) => {
  const res = await fetch("https://hello-world-jsx.deno.dev");
  const stream = new ReadableStream({
    start: (controller) => {
      const rewriter = new HTMLRewriter("utf8", (chunk: Uint8Array) => {
        controller.enqueue(chunk);
      });

      // Find the `h1` tag and add a random color style
      rewriter.on("h1", {
        element(el) {
          const r = Math.floor(Math.random() * 256)
          const g = Math.floor(Math.random() * 256)
          const b = Math.floor(Math.random() * 256)
          el.setAttribute("style", `color: rgba(${r}, ${g}, ${b}, 1);`);
        },
      });

      const reader = res.body.getReader();
      function push() {
        // "done" is a Boolean and value a `Uint8Array`
        reader.read().then(({ done, value }) => {
          // If there is no more data to read
          if (done) {
            console.log('done', done);
            rewriter.end();
            rewriter.free();
            controller.close();
            return;
          }
          // Get the data and send it to the Rewriter
          rewriter.write(value);
          push();
        })
      }

      push();
    }
  })
  return new Response(stream, { headers: res.headers })
};

serve(handler);
