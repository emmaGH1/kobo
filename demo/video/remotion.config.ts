import { Config } from "@remotion/cli/config";

// Tailwind is precompiled: npx @tailwindcss/cli -i src/style.css -o src/compiled.css
Config.setBrowserExecutable(process.env.REMOTION_CHROME ?? null);
