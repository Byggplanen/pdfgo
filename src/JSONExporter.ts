import "@geoman-io/leaflet-geoman-free";
import L, {MarkerOptions, PathOptions} from "leaflet";
import {CloudPolylineRenderer, cloudPolylineRenderer} from "./plugins/CloudPolyline/CloudPolylineRenderer";
import {ArrowRenderer, arrowRenderer} from "./plugins/Measure/ArrowRenderer";
import Ruler from "./plugins/Measure/Ruler";
import Area from "./plugins/Measure/Area";

type JSONRenderer = 'CloudPolylineRenderer' | 'ArrowRenderer'
type JSONType = 'Circle' | 'Polyline' | 'Marker' | 'Polygon' | 'Circlemarker';
type JSONShapeType = 'Area' | 'ArrowLine';

type JSONShape = {
  type?: JSONShapeType,
  tooltip?: string
}

interface JSONLayer {
  type: JSONType | null,
  latLngs?: any
  options: PathOptions,
  textMarker?: string
  renderer: JSONRenderer | null
  icon?: string
  shape: JSONShape
}

interface JSONExporterProps {
  map: L.Map
}

export default class JSONExporter {

  private map: L.Map;
  constructor({ map }: JSONExporterProps) {
    this.map = map
  }

  import(json: string): void {
    JSON.parse(json).forEach((feature: JSONLayer) => {
      const options: PathOptions = feature.options

      switch (feature.renderer) {
        case 'CloudPolylineRenderer':
          options.renderer = cloudPolylineRenderer(feature.options)
          break;
        case 'ArrowRenderer':
          options.renderer = arrowRenderer(feature.options)
          break;
      }

      if(feature.latLngs === undefined){
        return;
      }

      switch (feature.type) {
        case "Circle":
          new L.Circle(feature.latLngs, options).addTo(this.map);
          break;
        case "Polyline":
          const polyline = new L.Polyline(feature.latLngs, options)

          if (feature.shape.tooltip !== undefined) {
            polyline.setText(feature.shape.tooltip, Ruler.TEXT_OPTIONS)
          }

          polyline.addTo(this.map);
          break;
        case "Marker":
          const markerOptions = {...feature.options} as MarkerOptions
          markerOptions.draggable = true

          if (feature.textMarker !== undefined) {
            markerOptions.textMarker = true;
            markerOptions.text = feature.textMarker
            markerOptions.icon = undefined;
          } else {
            markerOptions.icon = new L.Icon.Default()
          }

          const marker = new L.Marker(feature.latLngs, markerOptions)
          marker.addTo(this.map);
          break;
        case "Polygon":
          const polygon = new L.Polygon(feature.latLngs, options);

          if (feature.shape.tooltip !== undefined) {
            polygon.bindTooltip(feature.shape.tooltip, Area.TOOLTIP_OPTIONS)
          }

          polygon.addTo(this.map);
          break;
        case "Circlemarker":
          new L.CircleMarker(feature.latLngs, options).addTo(this.map);
          break;
      }
    })
  }

  export(): string {

    const json: JSONLayer[] = []

    this.map.eachLayer(layer => {
      if (!(layer instanceof L.Circle ||
          layer instanceof L.Marker ||
          layer instanceof L.CircleMarker ||
          layer instanceof L.Polygon ||
          layer instanceof L.Polyline)) {
        return;
      }
      const opts = {...layer.options}

      const jsonLayer: JSONLayer = {
        type: null,
        options: opts,
        renderer: null,
        shape: {
          type: undefined,
          tooltip: undefined
        }
      }

      if (layer instanceof L.CircleMarker) {
        if (layer instanceof L.Circle) {
          jsonLayer.type = "Circle"
          jsonLayer.latLngs = layer.getBounds().getCenter()
        } else {
          jsonLayer.type = "Circlemarker"
          jsonLayer.latLngs = layer.getLatLng()
        }
      } else if (layer instanceof L.Polyline) {
        if (layer.options.renderer instanceof CloudPolylineRenderer) {
          jsonLayer.renderer = 'CloudPolylineRenderer'
        } else if(layer.options.renderer instanceof ArrowRenderer) {
          jsonLayer.renderer = 'ArrowRenderer'
          jsonLayer.shape.tooltip = layer._text
        }
        if (layer.getTooltip() !== undefined) {
          jsonLayer.shape.tooltip = layer.getTooltip()?.getContent()?.toString()
        }
        jsonLayer.latLngs = layer.getLatLngs()
        jsonLayer.options.renderer = undefined
        if (layer instanceof L.Polygon) {
          jsonLayer.type = "Polygon"
        } else {
          jsonLayer.type = "Polyline"
        }
      } else if (layer instanceof L.Marker) {
        jsonLayer.type = "Marker"
        jsonLayer.latLngs = layer.getLatLng()
        if (layer.options.icon instanceof L.DivIcon) {
          const html = layer.options.icon.options.html as HTMLTextAreaElement
          jsonLayer.textMarker =  html.value
        }
      }

      json.push(jsonLayer);
    })

    return JSON.stringify(json);
  }
}
