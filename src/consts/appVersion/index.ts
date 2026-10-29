import packageJson from "../../../package.json";

// Em releases o CI injeta VITE_APP_VERSION (versão da tag); localmente vale a do package.json.
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? packageJson.version;
