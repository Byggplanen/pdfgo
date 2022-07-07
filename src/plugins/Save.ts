import L from "leaflet";

export class Save {
  static readonly CONTROL_NAME = "Save";

  constructor(private map: L.Map, private onClick: () => void) {
    this.init();
  }

  private init() {
    if (this.map.pm.Toolbar.getControlOrder().includes(Save.CONTROL_NAME)) {
      return;
    }

    this.map.pm.Toolbar.createCustomControl({
      name: Save.CONTROL_NAME,
      block: "edit",
      title: "Save PDF",
      className: "leaflet-save-icon",
      toggle: false,
      afterClick: () => {
        this.onClick();
      },
    });
  }
}

export function save(map: L.Map, onClick: () => void) {
  return new Save(map, onClick);
}
