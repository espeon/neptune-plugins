import { html } from "@neptune/voby";
import { getSettings } from "@inrixia/lib/storage";
import { SwitchSetting } from "@inrixia/lib/components/SwitchSetting";
import { TextInput } from "@inrixia/lib/components/TextInput";
import { update } from ".";

export const settings = getSettings({
  eddySecureAPI: false,
  eddySecureAPIKey: "super-secret-eddy-key",
  eddyAPIPort: 3000,
});

export const Settings = () =>
  html`<${SwitchSetting}
      checked=${settings.eddySecureAPI}
      onClick=${() => {
        settings.eddySecureAPI = !settings.eddySecureAPI;
        update();
      }}
      title="Secure your API with a key"
    />
    <${TextInput}
      value=${settings.eddySecureAPIKey}
      onChange=${(e: { target: { value: string } }) => {
        settings.eddySecureAPIKey = e.target.value;
        update();
      }}
      placeholder="super-secret-eddy-key"
      title="Enter your API key"
    />
    <${TextInput}
      value=${settings.eddyAPIPort}
      onChange=${(e: { target: { value: string } }) => {
        settings.eddyAPIPort = parseInt(e.target.value);
        update();
      }}
      placeholder="3000"
      title="Enter your API port"
    />
    <p>
      <strong>Note:</strong> This plugin is still in development. Please report
      any bugs or issues you encounter. Some settings updates may need a plugin
      reload.
    </p> `;
