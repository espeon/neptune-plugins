import { html } from "@neptune/voby";
import { getSettings } from "@inrixia/lib/storage";
import { SwitchSetting } from "@inrixia/lib/components/SwitchSetting";
import { TextInput } from "@inrixia/lib/components/TextInput";
import { update } from "./index";

export const settings = getSettings({
  eddySecureAPI: false,
  eddySecureAPIKey: "super-secret-eddy-key",
  eddyAPIPort: 3665,
});

export const Settings = () =>
  html`<${SwitchSetting}
      checked=${settings.eddySecureAPI}
      onClick=${() => {
        settings.eddySecureAPI = !settings.eddySecureAPI;
        update();
      }}
      title="Key-based authentication"
    />
    <${TextInput}
      text=${settings.eddySecureAPIKey}
      onChange=${(text: string) => (settings.eddySecureAPIKey = text)}
      placeholder="super-secret-eddy-key"
      title="Key"
    />
    <${TextInput}
      text=${settings.eddyAPIPort}
      onChange=${(text: string) => (settings.eddyAPIPort = parseInt(text))}
      placeholder="3665"
      title="API port"
    />
    <p style="margin-top: 1rem; text-size: small;">
      <strong>Note:</strong> This plugin is still in development. Some settings
      updates may need a plugin reload.
    </p> `;
