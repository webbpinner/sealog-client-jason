import { USE_MAPTILE_PROXY } from './client_config';

const tilelayers = (USE_MAPTILE_PROXY) ? [
] : [
  {
    name: "Ocean Basemap",
    attribution: 'Tiles &copy; Esri',
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",
    default: true
  },
  {
    name: "OpenStreetMap",
    attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  },
  {
    name: "GMRT Basemap",
    wms: true,
    url: "http://gmrt.marine-geo.org/cgi-bin/mapserv?map=/public/mgg/web/gmrt.marine-geo.org/htdocs/services/map/wms_merc.map&",
    layers: "topo",
    transparent: false
  }
]

export default tilelayers; 
