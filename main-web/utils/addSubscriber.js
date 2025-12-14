export default async function addSubscriber(email) {
  await new Promise(r => setTimeout(r, 600));        // fake API
  return { ok: true };
}