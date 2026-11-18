import { error, json } from "../../lib/http.js";
import { upcomingProgrammes } from "../../lib/schedule.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return error("Método indisponível.", 405);
  if (!env.PROGRAMACAO_DB) return error("Programação temporariamente indisponível.", 503);
  try {
    return json(await upcomingProgrammes(env.PROGRAMACAO_DB));
  } catch (cause) {
    console.error("Failed to read programme schedule", cause);
    return error("Programação temporariamente indisponível.", 503);
  }
}
