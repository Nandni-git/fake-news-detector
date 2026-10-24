
import "dotenv/config";

const KEY = process.env.GUARDIAN_API_KEY;

console.log("Guardian key loaded:", Boolean(KEY));